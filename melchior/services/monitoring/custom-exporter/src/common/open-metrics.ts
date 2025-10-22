type OpenMetricsDataModel = {
  name: string;
  description: string;
};

type OpenMetricsDataModelWithUnit = OpenMetricsDataModel & {
  unit?: string;
};

export class OpenMetrics {
  readonly lines: string[] = [];
  constructor(private readonly moduleName: string) {}

  addBoolean(
    model: OpenMetricsDataModel,
    entries: { value: boolean; labels?: Record<string, string> }[]
  ) {
    model.name = `${this.moduleName}_${model.name}`;
    this.addDataModel(model, "stateset");
    entries.forEach(({ value, labels }) => {
      this.addLine(model.name, value ? 1 : 0, {
        ...labels,
        state: "true",
      });
      this.addLine(model.name, value ? 0 : 1, {
        ...labels,
        state: "false",
      });
    });
  }

  addInfo(model: OpenMetricsDataModel, labels: Record<string, string>[]) {
    model.name = `${this.moduleName}_${model.name}_info`;
    this.addDataModel(model, "info");
    labels.forEach((labels) => {
      this.addLine(model.name, 1, labels);
    });
  }

  addCounter(
    model: OpenMetricsDataModelWithUnit,
    entries: { value: number; labels?: Record<string, string> }[]
  ) {
    model.name = `${this.moduleName}_${model.name}${
      model.unit ? `_${model.unit}` : ""
    }`;
    this.addDataModel(model, "counter");
    entries.forEach(({ value, labels }) => {
      this.addLine(model.name, value, labels);
    });
  }

  addGauge(
    model: OpenMetricsDataModelWithUnit,
    entries: { value: number; labels?: Record<string, string> }[]
  ) {
    model.name = `${this.moduleName}_${model.name}${
      model.unit ? `_${model.unit}` : ""
    }`;
    this.addDataModel(model, "gauge");
    entries.forEach(({ value, labels }) => {
      this.addLine(model.name, value, labels);
    });
  }

  private addDataModel(
    model: OpenMetricsDataModelWithUnit,
    type:
      | "unknown"
      | "gauge"
      | "counter"
      | "stateset"
      | "info"
      | "histogram"
      | "gaugehistogram"
      | "summary"
  ) {
    this.lines.push(`# TYPE ${model.name} ${type}`);
    this.lines.push(`# HELP ${model.name} ${model.description}`);
    if (model.unit) {
      this.lines.push(`# UNIT ${model.name} ${model.unit}`);
    }
  }

  private addLine(
    propertyName: string,
    value?: number,
    labels?: Record<string, string>
  ) {
    const labelString = labels
      ? `{${Object.entries(labels)
          .map(([key, value]) => `${key}="${value}"`)
          .join(",")}}`
      : "";

    this.lines.push(`${propertyName}${labelString} ${value}`);
  }

  toResponse(): Response {
    this.lines.push("# EOF");
    return new Response(this.lines.join("\n"), {
      headers: {
        "Content-Type":
          "application/openmetrics-text; version=1.0.0; charset=utf-8",
      },
    });
  }
}
