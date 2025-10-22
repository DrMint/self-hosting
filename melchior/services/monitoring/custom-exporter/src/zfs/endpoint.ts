import { ZfsDataset } from "./zfs-dataset";
import { OpenMetrics } from "../common/open-metrics";

export const zfsEndpoint = async (): Promise<Response> => {
  const datasets = await ZfsDataset.getAllDatasets();
  const openMetrics = new OpenMetrics("zfs");

  openMetrics.addInfo(
    {
      name: "creation",
      description: "The time this dataset was created.",
    },
    datasets.map((dataset) => ({
      dataset: dataset.dataset.name,
      creation: new Date(
        Number(dataset.properties.creation.value) * 1000
      ).toISOString(),
    }))
  );

  openMetrics.addGauge(
    {
      name: "used",
      description:
        "The amount of space consumed by this dataset and all its descendants.",
      unit: "bytes",
    },
    datasets.map((dataset) => ({
      labels: { dataset: dataset.dataset.name },
      value: Number(dataset.properties.used.value),
    }))
  );

  openMetrics.addGauge(
    {
      name: "available",
      description:
        "The amount of space available to the dataset and all its children.",
      unit: "bytes",
    },
    datasets.map((dataset) => ({
      labels: { dataset: dataset.dataset.name },
      value: Number(dataset.properties.available.value),
    }))
  );

  openMetrics.addInfo(
    {
      name: "mountpoint",
      description: "Where the dataset is mounted in the filesystem.",
    },
    datasets.map((dataset) => ({
      dataset: dataset.dataset.name,
      mountpoint: dataset.properties.mountpoint.value,
    }))
  );

  openMetrics.addGauge(
    {
      name: "compressratio",
      description: "The compression ratio of the dataset.",
      unit: "ratio",
    },
    datasets.map((dataset) => ({
      labels: { dataset: dataset.dataset.name },
      value: Number(dataset.properties.compressratio.value),
    }))
  );

  openMetrics.addInfo(
    {
      name: "compression",
      description: "The compression algorithm used for this dataset.",
    },
    datasets.map((dataset) => ({
      dataset: dataset.dataset.name,
      compression: dataset.properties.compression.value,
    }))
  );

  openMetrics.addBoolean(
    {
      name: "atime",
      description: "Whether atime is enabled for this dataset.",
    },
    datasets.map((dataset) => ({
      labels: { dataset: dataset.dataset.name },
      value: dataset.properties.atime.value === "on",
    }))
  );

  openMetrics.addBoolean(
    {
      name: "relatime",
      description: "Whetherrelatime is enabled for this dataset.",
    },
    datasets.map((dataset) => ({
      labels: { dataset: dataset.dataset.name },
      value: dataset.properties.relatime.value === "on",
    }))
  );

  openMetrics.addBoolean(
    {
      name: "encryption",
      description: "Whether encryption is enabled for this dataset.",
    },
    datasets.map((dataset) => ({
      labels: { dataset: dataset.dataset.name },
      value: dataset.properties.encryption.value === "on",
    }))
  );

  return openMetrics.toResponse();
};
