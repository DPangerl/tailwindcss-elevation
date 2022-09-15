interface Config {
  x: number;
  y: number;
  tintShadows?: boolean;
  shadowColorCP?: string;
  oomph?: number;
  crispy?: number;
  resolution?: number;
}

declare const plugin: (config: Config) => Plugin;
export = plugin;
