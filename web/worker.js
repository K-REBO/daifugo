// Steel エンジン（wasm）を Web Worker で動かす。
// 初期化（約 350ms）や AI の思考で画面が固まらないようにするため。
import init, { Engine } from './pkg/daifugo_wasm.js';

let engine;
const ready = (async () => {
  await init();
  engine = new Engine();
})();

self.onmessage = async (ev) => {
  const { id, method, func, args, name, src } = ev.data;
  try {
    await ready;
    let result;
    switch (method) {
      case 'call':
        result = JSON.parse(engine.call(func, JSON.stringify(args ?? [])));
        break;
      case 'load':
        engine.loadSource(name, src);
        result = true;
        break;
      case 'eval':
        result = engine.eval(src);
        break;
      default:
        throw new Error(`unknown method ${method}`);
    }
    self.postMessage({ id, ok: true, result });
  } catch (e) {
    self.postMessage({ id, ok: false, error: String(e?.message ?? e) });
  }
};
