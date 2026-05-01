import type { BaseEngine, EngineContext, EngineUpdateContext } from "./BaseEngine";

export class EngineManager {
  private engines: BaseEngine[] = [];
  private context: EngineContext;

  constructor(context: EngineContext) {
    this.context = context;
  }

  register(engine: BaseEngine): void {
    engine.init(this.context);
    this.engines.push(engine);
    this.engines.sort((a, b) => a.priority - b.priority);
  }

  update(dt: number): void {
    const updateContext: EngineUpdateContext = { dt };

    for (const engine of this.engines) {
      if (engine.enabled && engine.update) {
        engine.update(updateContext);
      }
    }
  }

  getEngine<T extends BaseEngine>(name: string): T | undefined {
    return this.engines.find((e) => e.name === name) as T | undefined;
  }

  dispose(): void {
    for (const engine of this.engines) {
      engine.dispose?.();
    }
    this.engines = [];
  }
}
