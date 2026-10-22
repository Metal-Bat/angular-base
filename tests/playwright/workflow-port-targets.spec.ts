import { expect, test } from './fixtures';

for (const collapsedWorkflow of [false, true]) {
  test.describe(
    collapsedWorkflow ? 'Saved collapsed nodes' : 'Expanded nodes',
    () => {
      test.use({ collapsedWorkflow });
      test('Workflow port targets remain distinct and at least 24 pixels after canvas zoom', async ({
        page,
        appURL,
      }): Promise<void> => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(appURL + '/studio/workflow-versions/fixture-flow/edit');
        await page
          .getByRole('button', { name: 'Focus mode', exact: true })
          .click();
        await page
          .getByRole('button', { name: 'Reset view', exact: true })
          .click();
        const save = async (): Promise<Record<string, unknown>> => {
          const write = page.waitForRequest(
            (request) =>
              request.method() === 'PUT' &&
              request
                .url()
                .endsWith('/workflow-versions/fixture-flow/workspace'),
          );
          await page
            .getByRole('button', { name: 'Save workspace', exact: true })
            .click();
          const document = (await write).postDataJSON().document;
          await expect(
            page.getByText(
              'Workspace saved. This is not an executable graph.',
              {
                exact: true,
              },
            ),
          ).toBeVisible();
          return document;
        };
        const before = await save();
        let currentZoom = 100;
        for (const zoom of [100, 80, 50]) {
          while (currentZoom > zoom) {
            await page
              .getByRole('button', { name: 'Zoom out', exact: true })
              .click();
            currentZoom -= 10;
            await expect(page.locator('.zoom-value')).toHaveText(
              currentZoom + '%',
            );
          }
          await expect(page.locator('.zoom-value')).toHaveText(zoom + '%');
          const sockets = page.locator('.board-node .port-socket');
          await expect(sockets).toHaveCount(8);
          for (const socket of await sockets.all()) {
            const bounds = await socket.boundingBox();
            expect(bounds).not.toBeNull();
            expect(bounds!.width).toBeGreaterThanOrEqual(24);
            expect(bounds!.height).toBeGreaterThanOrEqual(24);
            expect(
              await socket.evaluate((element) => {
                const box = element.getBoundingClientRect();
                return (
                  element.ownerDocument
                    .elementFromPoint(
                      box.x + box.width / 2,
                      box.y + box.height / 2,
                    )
                    ?.closest('.port-socket') === element
                );
              }),
            ).toBe(true);
          }
          for (const node of await page.locator('.board-node').all()) {
            const boxes = await Promise.all(
              (await node.locator('.port-socket').all()).map((socket) =>
                socket.boundingBox(),
              ),
            );
            for (let first = 0; first < boxes.length; first++) {
              for (let second = first + 1; second < boxes.length; second++) {
                const a = boxes[first]!;
                const b = boxes[second]!;
                const overlap =
                  Math.min(a.x + a.width, b.x + b.width) > Math.max(a.x, b.x) &&
                  Math.min(a.y + a.height, b.y + b.height) > Math.max(a.y, b.y);
                expect(overlap, 'Each port needs its own pointer region').toBe(
                  false,
                );
              }
            }
          }
          for (const socket of await page
            .locator('.control-port .port-socket')
            .all()) {
            await expect(socket).toHaveCSS('border-radius', '50%');
          }
          for (const socket of await page
            .locator('.data-port .port-socket')
            .all()) {
            await expect(socket).toHaveCSS('border-radius', '2px');
          }
          await page.screenshot({
            path: test
              .info()
              .outputPath('workflow-port-targets-' + zoom + '.png'),
            fullPage: true,
          });
        }
        const after = await save();
        expect(after['graph']).toEqual(before['graph']);
        expect(after['positions']).toEqual(before['positions']);
        expect(after['routing']).toEqual(before['routing']);
        expect(after['collapsed']).toEqual(before['collapsed']);
        await page.screenshot({
          path: test.info().outputPath('workflow-port-targets.png'),
          fullPage: true,
        });
      });
    },
  );
}
