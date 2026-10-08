// Disposable UI fixture; no real accounts, authored documents, or backend writes.
export function createCanvasFixture() {
  let document = {
    dialect: "bpms.workspace/1",
    graph: {
      steps: [
        {
          key: "prepare",
          type_code: "transform",
          type_version_ref: "fixture-type",
          config: {},
        },
        {
          key: "review",
          type_code: "transform",
          type_version_ref: "fixture-type",
          config: {},
        },
      ],
      transitions: [{ source: "prepare", target: "review", outcome: "next" }],
      bindings: [
        {
          source_kind: "STEP_OUTPUT",
          source_step: "prepare",
          source_port: "result",
          step: "review",
          target_port: "value",
        },
      ],
    },
    positions: { prepare: { x: 50, y: 70 }, review: { x: 350, y: 200 } },
    viewport: { x: 0, y: 0, zoom: 1 },
    collapsed: [],
    routing: {},
  };
  let published = false;
  const state = () => ({
    workspace_ref_id: "fixture-workspace",
    workflow_version_ref_id: "fixture-flow",
    document,
    promoted_graph_checksum: null,
  });
  return {
    handle(method, path, body) {
      if (path.endsWith("/designer/catalog"))
        return {
          success: true,
          result: {
            items: [
              {
                key: "transform",
                title: "Transform",
                category: "step_type",
                metadata: {
                  code: "transform",
                  ref_id: "fixture-type",
                  ports: [
                    {
                      port_key: "value",
                      direction: "INPUT",
                      value_schema: { type: "string" },
                    },
                    {
                      port_key: "result",
                      direction: "OUTPUT",
                      value_schema: { type: "string" },
                    },
                  ],
                },
              },
            ],
            page: 1,
            total_pages: 1,
            size: 100,
            total: 1,
          },
        };
      if (path.endsWith("/workflow-versions/fixture-flow/workspace")) {
        if (method === "PUT") document = JSON.parse(body).document;
        return { success: true, data: state() };
      }
      if (path.endsWith("/workflow-versions/fixture-flow/publish")) {
        published = true;
        return {
          success: true,
          data: { ref_id: "fixture-flow", status: "PUBLISHED" },
        };
      }
      if (path.endsWith("/workflow-versions/fixture-flow"))
        return {
          success: true,
          data: {
            ref_id: "fixture-flow",
            status: published ? "PUBLISHED" : "DRAFT",
          },
        };
      return null;
    },
  };
}

export const canvasBrowserScript = `
 const button = label => [...document.querySelectorAll('main button')].find(el=>el.textContent.trim()===label);
 const click = async label => { const el=button(label);check(el&&!el.disabled,'enabled '+label);el.click();await new Promise(r=>setTimeout(r,100)); };
 window.fixtureStage='canvas-ready';
 await wait(()=>document.querySelectorAll('.board-node').length===2 && document.querySelector('.data-port'),'canvas nodes and typed ports');
 check(document.querySelector('.data-edge'),'data edge');
 check(getComputedStyle(document.querySelector('f-flow')).backgroundImage.includes('radial-gradient'),'visible grid');
 const node = document.querySelector('.board-node');
 node.querySelector('button').click();
 await wait(()=>node.classList.contains('selected') && node.querySelector('button').getAttribute('aria-pressed')==='true','selected node and inspector');
 check(document.querySelector('.step-inspector h2').textContent.includes('prepare'),'selected inspector key');
 const original=node.style.transform;
 node.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));
 await wait(()=>node.style.transform!==original,'keyboard movement');
 window.fixtureStage='canvas-zoom';
 document.querySelector('button[aria-label="Zoom in"]').click();
 await wait(()=>document.querySelector('.zoom-value').textContent.trim()==='110%','zoom in');
 document.querySelector('button[aria-label="Zoom out"]').click();
 await wait(()=>document.querySelector('.zoom-value').textContent.trim()==='100%','zoom out');
 await click('Fit to view');await click('Reset view');
 await wait(()=>document.querySelector('.zoom-value').textContent.trim()==='100%','reset scale');
 window.fixtureStage='canvas-save';
 const moved=node.style.transform;
 await click('Save workspace');await wait(()=>text().includes('Workspace saved.'),'saved workspace');
 await click('Reload');await wait(()=>document.querySelector('.board-node')?.style.transform===moved,'saved position reloaded');
 check(!document.querySelector('.board-node.selected'),'reload clears selection');
 document.querySelector('.board-node button').click();
 await wait(()=>JSON.parse(document.querySelector('#step-json').value).key==='prepare','selected configuration');
 const editor=document.querySelector('#step-json');editor.value=editor.value.replace('"config": {}','"config": {"fixture":true}');editor.dispatchEvent(new Event('input',{bubbles:true}));
 await wait(()=>document.querySelector('button[aria-label="Zoom in"]').disabled,'pending JSON fences canvas commands');
 await click('Apply step');await click('Save workspace');
 window.fixtureStage='canvas-add-undo';
 const keyInput=document.querySelector('#step-key');keyInput.value='added';keyInput.dispatchEvent(new Event('input',{bubbles:true}));
 await click('Add step');await wait(()=>document.querySelectorAll('.board-node').length===3,'add step');
 await click('Undo');await wait(()=>document.querySelectorAll('.board-node').length===2,'undo step');
 check(!document.querySelector('.board-node.selected') && document.querySelector('#step-json').disabled,'undo clears removed selection');
 await click('Redo');await wait(()=>document.querySelectorAll('.board-node').length===3,'redo step');
 await click('Undo');await click('Save workspace');
 window.fixtureStage='canvas-palette-drop';
 const palette=document.querySelector('.palette-item');check(palette,'Palette entry');
 const before=document.querySelectorAll('.board-node').length;
 const transfer=new DataTransfer();palette.dispatchEvent(new DragEvent('dragstart',{dataTransfer:transfer,bubbles:true}));
 const stage=document.querySelector('.canvas-stage');const bounds=stage.getBoundingClientRect();
 stage.dispatchEvent(new DragEvent('drop',{dataTransfer:transfer,clientX:bounds.left+150,clientY:bounds.top+150,bubbles:true,cancelable:true}));
 await wait(()=>document.querySelectorAll('.board-node').length===before+1,'Palette drop adds step');
 await click('Undo');await wait(()=>document.querySelectorAll('.board-node').length===before,'Undo dropped step');
 palette.click();await wait(()=>document.querySelector('.canvas-stage.placing-step'),'Selected palette placement');check(document.querySelectorAll('.board-node').length===before,'Selection created a step before placement');const placeBounds=stage.getBoundingClientRect();stage.dispatchEvent(new MouseEvent('click',{clientX:placeBounds.left+180,clientY:placeBounds.top+180,bubbles:true}));await wait(()=>document.querySelectorAll('.board-node').length===before+1,'Palette click placement');check(!document.querySelector('.canvas-stage.placing-step'),'Placement did not clear selection');
 await click('Undo');palette.click();await wait(()=>stage.classList.contains('placing-step'),'Keyboard placement ready');stage.focus();stage.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));await wait(()=>document.querySelectorAll('.board-node').length===before+1,'Keyboard placement');await click('Undo');document.querySelector('.palette-add').click();await wait(()=>document.querySelectorAll('.board-node').length===before+1,'Palette quick add');
 await click('Undo');await click('Save workspace');
 window.fixtureStage='canvas-accessibility';
 await auditAccessibility('workflow-canvas-light');
 check(document.documentElement.scrollWidth<=innerWidth+1,'canvas responsive overflow');
 await toggleTheme();await wait(()=>document.documentElement.classList.contains('app-dark'),'dark canvas');
 await auditAccessibility('workflow-canvas-dark');
 {document.querySelector('[data-language-picker] [role="combobox"]').click();await wait(()=>[...document.querySelectorAll('[role="option"]')].some(option=>option.textContent.includes('فارسی')),'Language options');[...document.querySelectorAll('[role="option"]')].find(option=>option.textContent.includes('فارسی')).click();}await wait(()=>document.documentElement.dir==='rtl','canvas Persian RTL');
 check(document.documentElement.scrollWidth<=innerWidth+1,'RTL canvas responsive overflow');
 await auditAccessibility('workflow-canvas-persian-dark');
 await fetch('/test-result',{method:'POST',body:JSON.stringify({ok:true,accessibility})});
`;
