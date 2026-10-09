import { readFileSync } from "node:fs";
const inspector = JSON.parse(
  readFileSync(
    new URL(
      "../docs/reference/app-be-wave-four/inspector-en.json",
      import.meta.url,
    ),
  ),
);
const transform = inspector.handlers.find(
  (handler) =>
    handler.handler_key === "transform" && handler.handler_version === "1",
);
const timer = inspector.handlers.find(
  (handler) => handler.handler_key === "timer",
);
const subprocess = inspector.handlers.find(
  (handler) => handler.handler_key === "subprocess",
);
// Disposable UI fixture; no real accounts, authored documents, or backend writes.
export function createCanvasFixture() {
  let document = {
    dialect: "bpms.workspace/1",
    graph: {
      steps: [
        {
          key: "prepare",
          type_code: "TRANSFORM",
          type_version_ref: "fixture-type",
          config: { conversion_key: "string" },
        },
        {
          key: "review",
          type_code: "TRANSFORM",
          type_version_ref: "fixture-type",
          config: { conversion_key: "string" },
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
                type_schema: transform.config_schema,
                metadata: {
                  handler_key: "transform",
                  handler_version: "1",
                  runtime_available: true,
                  code: "TRANSFORM",
                  ref_id: "fixture-type",
                  ports: [
                    {
                      port_key: "value",
                      direction: "INPUT",
                      cardinality: "SCALAR",
                      value_schema: { type: "string" },
                    },
                    {
                      port_key: "result",
                      direction: "OUTPUT",
                      cardinality: "SCALAR",
                      value_schema: { type: "string" },
                    },
                  ],
                },
              },
              {
                key: "timer",
                title: "Timer",
                category: "step_type",
                type_schema: timer.config_schema,
                metadata: {
                  code: "TIMER",
                  ref_id: "fixture-timer",
                  handler_key: "timer",
                  handler_version: "1",
                  runtime_available: true,
                  ports: timer.ports,
                },
              },
              {
                key: "subprocess",
                title: "Subprocess",
                category: "step_type",
                type_schema: subprocess.config_schema,
                metadata: {
                  code: "SUBPROCESS",
                  ref_id: "fixture-subprocess",
                  handler_key: "subprocess",
                  handler_version: "1",
                  runtime_available: true,
                  ports: subprocess.ports,
                },
              },
              {
                key: "child:1",
                title: "Child flow",
                category: "subprocess",
                type_schema: {},
                metadata: {
                  workflow_version_ref: "fixture-child",
                  runtime_available: true,
                  call_step_type: "SUBPROCESS",
                  interface: {
                    inputs: [
                      {
                        name: "flag",
                        required: true,
                        value_schema: { type: "boolean" },
                      },
                      {
                        name: "amount",
                        required: true,
                        value_schema: { type: "integer", minimum: 0 },
                      },
                    ],
                    outputs: [],
                    outcomes: { done: "finish" },
                  },
                },
              },
            ],
            page: 1,
            total_pages: 1,
            size: 100,
            total: 4,
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
 const dragPort = async (from, to) => {
   await click('Fit to view');
   document.querySelector('.canvas-stage').scrollIntoView({block:'center',behavior:'instant'});
   await new Promise(requestAnimationFrame);
   const a=from.getBoundingClientRect(),b=to.getBoundingClientRect();
   check(parseFloat(getComputedStyle(from).width)>=16 && parseFloat(getComputedStyle(to).width)>=16 && a.width>0 && a.height>0 && b.width>0 && b.height>0,'visible port hit areas '+JSON.stringify({source:{width:a.width,height:a.height},target:{width:b.width,height:b.height},zoom:document.querySelector('.zoom-value')?.textContent}));
   const start={clientX:a.left+a.width/2,clientY:a.top+a.height/2};
   const end={clientX:b.left+b.width/2,clientY:b.top+b.height/2};
   check(document.elementFromPoint(start.clientX,start.clientY)===from,'output port is reachable '+JSON.stringify({x:start.clientX,y:start.clientY,hit:document.elementFromPoint(start.clientX,start.clientY)?.outerHTML.slice(0,250)}));
   check(document.elementFromPoint(end.clientX,end.clientY)===to,'input port is reachable '+JSON.stringify({x:end.clientX,y:end.clientY,hit:document.elementFromPoint(end.clientX,end.clientY)?.outerHTML.slice(0,250)}));
   from.dispatchEvent(new MouseEvent('mousedown',{...start,button:0,buttons:1,bubbles:true,cancelable:true}));
   document.dispatchEvent(new MouseEvent('mousemove',{clientX:start.clientX+10,clientY:start.clientY,buttons:1,bubbles:true,cancelable:true}));
   await new Promise(r=>setTimeout(r,50));
   document.dispatchEvent(new MouseEvent('mousemove',{...end,buttons:1,bubbles:true,cancelable:true}));
   await new Promise(r=>setTimeout(r,50));
   to.dispatchEvent(new PointerEvent('pointerup',{...end,button:0,buttons:0,bubbles:true,cancelable:true}));
 };
 const button = label => [...document.querySelectorAll('main button')].find(el=>el.textContent.trim()===label);
 const click = async label => { const el=button(label);check(el&&!el.disabled,'enabled '+label);el.click();await new Promise(r=>setTimeout(r,100));if(label==='Reload'){await wait(()=>!button('Reload').disabled&&!document.querySelector('.board-node.selected'),'reload response clears selection');}if(label==='Save workspace'){await wait(()=>!button('Save workspace').disabled,'save response completed');} };
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
 await wait(()=>!document.querySelector('button[aria-label="Zoom in"]').disabled,'canvas controls rendered');
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
 const editor=document.querySelector('#step-json');const expert=JSON.parse(editor.value);expert.config.fixture=true;editor.value=JSON.stringify(expert);editor.dispatchEvent(new Event('input',{bubbles:true}));
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
 window.fixtureStage='canvas-selection-duplicate';
 const selectionPanel=[...document.querySelectorAll('details')].find(item=>item.querySelector('summary')?.textContent.trim()==='Selection and connections');selectionPanel.open=true;
 const selections=[...selectionPanel.querySelectorAll('input[type="checkbox"]')];selections[0].click();selections[1].click();
 const originalPositions=[...document.querySelectorAll('.board-node')].map(item=>item.style.transform);
 document.querySelector('.board-node').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));
 await wait(()=>[...document.querySelectorAll('.board-node')].every((item,index)=>item.style.transform!==originalPositions[index]),'atomic selected group keyboard movement');
 await click('Undo');await click('Duplicate selection');await wait(()=>document.querySelectorAll('.board-node').length===3,'single selection duplicate after undo');
 await click('Undo');await wait(()=>document.querySelectorAll('.board-node').length===2,'undo duplicated node');
 document.getElementById('connection-select').click();await wait(()=>[...document.querySelectorAll('[role="option"]')].some(option=>option.textContent.includes('control')),'connection options');
 [...document.querySelectorAll('[role="option"]')].find(option=>option.textContent.includes('control')).click();
 await wait(()=>button('Remove connection')&&!button('Remove connection').disabled,'remove connection action ready');await click('Remove connection');await wait(()=>!document.querySelector('f-connection:not(.data-edge)')&&document.querySelector('.data-edge'),'control removal preserves data bindings');
 window.fixtureStage='canvas-drag-control-connection';
 await dragPort(document.querySelector('.board-node .control-port.output-port .port-socket'),document.querySelectorAll('.board-node')[1].querySelector('.control-port .input-socket'));
 await wait(()=>document.querySelector('f-connection:not(.data-edge)'),'drag creates control connection');
 await click('Save workspace');await click('Reload');await wait(()=>document.querySelector('f-connection:not(.data-edge)'),'dragged control connection saved and reloaded');
 document.getElementById('canvas-find').click();await wait(()=>[...document.querySelectorAll('[role="option"]')].some(option=>option.textContent.includes('review')),'find review');
 [...document.querySelectorAll('[role="option"]')].find(option=>option.textContent.includes('review')).click();await wait(()=>document.querySelector('.step-inspector h2').textContent.includes('review'),'find selected review');
 selectionPanel.open=false;await click('Save workspace');
 window.fixtureStage='typed-mapping-roundtrip';
 selectionPanel.open=true;document.getElementById('connection-select').click();await wait(()=>[...document.querySelectorAll('[role="option"]')].some(option=>option.textContent.includes('data')),'data mapping options');
 [...document.querySelectorAll('[role="option"]')].find(option=>option.textContent.includes('data')).click();await wait(()=>!button('Remove connection').disabled,'remove existing mapping ready');await click('Remove connection');
 window.fixtureStage='canvas-drag-data-connection';
 await dragPort(document.querySelector('.board-node .data-port.output-port .port-socket'),document.querySelectorAll('.board-node')[1].querySelector('.data-port .input-socket'));
 await wait(()=>document.querySelector('.data-edge'),'drag creates typed data connection');
 await click('Save workspace');await click('Reload');await wait(()=>document.querySelector('.data-edge'),'dragged data connection saved and reloaded');
 document.querySelectorAll('.board-node button')[1].click();
 await wait(()=>JSON.parse(document.getElementById('graph-json').value).bindings[0]?.source_kind==='STEP_OUTPUT','dragged mapping retains source kind');
 document.getElementById('connection-select').click();await wait(()=>[...document.querySelectorAll('[role="option"]')].some(option=>option.textContent.includes('data')),'dragged mapping options');
 [...document.querySelectorAll('[role="option"]')].find(option=>option.textContent.includes('data')).click();await wait(()=>!button('Remove connection').disabled,'dragged mapping removal ready');await click('Remove connection');
 document.getElementById('mapping-target').click();await wait(()=>[...document.querySelectorAll('[role="option"]')].some(option=>option.textContent.includes('value')),'typed target options');
 [...document.querySelectorAll('[role="option"]')].find(option=>option.textContent.includes('value')).click();await wait(()=>document.getElementById('mapping-constant'),'typed constant');
 const constant=document.getElementById('mapping-constant');constant.value='mapped sample';constant.dispatchEvent(new Event('input',{bubbles:true}));await click('Add data mapping');await click('Save workspace');await click('Reload');document.querySelectorAll('.board-node button')[1].click();await wait(()=>JSON.parse(document.getElementById('graph-json').value).bindings[0]?.constant_value==='mapped sample','mapping saved and reloaded');
 check(JSON.parse(document.getElementById('graph-json').value).transitions.length===1,'mapping preserved control transitions');selectionPanel.open=false;
 window.fixtureStage='typed-timer-roundtrip';
 [...document.querySelectorAll('.palette-card')].find(card=>card.textContent.includes('Timer')).querySelector('.palette-add').click();
 await wait(()=>document.getElementById('node-delay_seconds'),'typed timer inspector');const delay=document.getElementById('node-delay_seconds');delay.value='0';delay.dispatchEvent(new Event('input',{bubbles:true}));await click('Apply typed configuration');
 check(document.querySelector('app-node-inspector [role="alert"]'),'invalid timer inline error');check(button('Save workspace').disabled,'invalid timer draft fences save');
 delay.value='12';delay.dispatchEvent(new Event('input',{bubbles:true}));await click('Apply typed configuration');await click('Save workspace');await click('Reload');
 [...document.querySelectorAll('.board-node')].find(node=>node.textContent.includes('TIMER')).querySelector('button').click();await wait(()=>document.getElementById('node-delay_seconds')?.value==='12','typed timer save/reopen');
 check(JSON.parse(document.getElementById('step-json').value).type_version_ref==='fixture-timer','timer type version pin preserved');
 window.fixtureStage='typed-subprocess-roundtrip';
 [...document.querySelectorAll('.palette-card')].find(card=>card.textContent.includes('Subprocess')).querySelector('.palette-add').click();
 await wait(()=>document.getElementById('subprocess-version'),'child version picker');document.getElementById('subprocess-version').click();await wait(()=>[...document.querySelectorAll('[role="option"]')].some(option=>option.textContent.includes('Child flow')),'approved child version');
 [...document.querySelectorAll('[role="option"]')].find(option=>option.textContent.includes('Child flow')).click();await wait(()=>document.getElementById('child-flag')&&document.getElementById('child-amount'),'typed child inputs');
 document.getElementById('child-flag').click();document.getElementById('child-flag').click();const amount=document.getElementById('child-amount');amount.value='-1';amount.dispatchEvent(new Event('input',{bubbles:true}));await click('Apply typed configuration');check(button('Save workspace').disabled,'invalid child input fences save');
 amount.value='0';amount.dispatchEvent(new Event('input',{bubbles:true}));await click('Apply typed configuration');await click('Save workspace');await click('Reload');
 [...document.querySelectorAll('.board-node')].find(node=>node.textContent.includes('SUBPROCESS')).querySelector('button').click();await wait(()=>document.getElementById('child-amount')?.value==='0','child inputs saved and reopened');
 const child=JSON.parse(document.getElementById('step-json').value).subprocess;check(child.workflow_version_ref==='fixture-child','exact child version pinned');check(child.inputs.find(input=>input.name==='flag').constant_value===false && child.inputs.find(input=>input.name==='amount').constant_value===0,'canonical child false and zero');check(document.getElementById('subprocess-version').getAttribute('aria-disabled')==='true' || document.getElementById('subprocess-version').classList.contains('p-disabled'),'mapped child version cannot silently change');
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
