import { OpenMetrics } from "../common/open-metrics";
import { BlockStat } from "./blockStat";

let blockStats: BlockStat[];

export const blockStatEndpoint = async (): Promise<Response> => {
  if (blockStats === undefined) {
    blockStats = await BlockStat.getBlocksStat();
  } else {
    await Promise.all(blockStats.map((blockStat) => blockStat.refresh()));
  }

  const stats = blockStats.map((blockStat) => ({
    name: blockStat.name,
    stat: blockStat.delta,
  }));

  const openMetrics = new OpenMetrics("blockstat");

  openMetrics.addGauge(
    {
      name: "reads_completed",
      description: "The number of reads completed per second.",
    },
    stats.map((blockStat) => ({
      labels: { name: blockStat.name },
      value: blockStat.stat.readsCompleted,
    }))
  );

  openMetrics.addGauge(
    {
      name: "reads_merged",
      description: "The number of reads merged.",
    },
    stats.map((blockStat) => ({
      labels: { name: blockStat.name },
      value: blockStat.stat.readsMerged,
    }))
  );

  openMetrics.addGauge(
    {
      name: "sectors_read",
      description: "The number of sectors read per second.",
    },
    stats.map((blockStat) => ({
      labels: { name: blockStat.name },
      value: blockStat.stat.sectorsRead,
    }))
  );

  openMetrics.addGauge(
    {
      name: "read_time",
      description: "The percentage of time spent on reads.",
      unit: "ratio",
    },
    stats.map((blockStat) => ({
      labels: { name: blockStat.name },
      value: blockStat.stat.readTime,
    }))
  );

  openMetrics.addGauge(
    {
      name: "writes_completed",
      description: "The number of writes completed per second.",
    },
    stats.map((blockStat) => ({
      labels: { name: blockStat.name },
      value: blockStat.stat.writesCompleted,
    }))
  );

  openMetrics.addGauge(
    {
      name: "writes_merged",
      description: "The number of writes merged.",
    },
    stats.map((blockStat) => ({
      labels: { name: blockStat.name },
      value: blockStat.stat.writesMerged,
    }))
  );

  openMetrics.addGauge(
    {
      name: "sectors_written",
      description: "The number of sectors written per second.",
    },
    stats.map((blockStat) => ({
      labels: { name: blockStat.name },
      value: blockStat.stat.sectorsWritten,
    }))
  );

  openMetrics.addGauge(
    {
      name: "write_time",
      description: "The percentage of time spent on writes.",
      unit: "ratio",
    },
    stats.map((blockStat) => ({
      labels: { name: blockStat.name },
      value: blockStat.stat.writeTime,
    }))
  );

  openMetrics.addGauge(
    {
      name: "iops_in_progress",
      description: "The number of I/Os currently in progress.",
    },
    blockStats.map((blockStat) => ({
      labels: { name: blockStat.name },
      value: blockStat.iopsInProgress,
    }))
  );

  openMetrics.addGauge(
    {
      name: "io_time",
      description: "The percentage of time spent on I/Os.",
      unit: "ratio",
    },
    stats.map((blockStat) => ({
      labels: { name: blockStat.name },
      value: blockStat.stat.ioTime,
    }))
  );

  // Skipping weighted_io_time because it is not useful

  openMetrics.addGauge(
    {
      name: "discards_completed",
      description: "The number of discards completed per second.",
    },
    stats.map((blockStat) => ({
      labels: { name: blockStat.name },
      value: blockStat.stat.discardsCompleted,
    }))
  );

  openMetrics.addGauge(
    {
      name: "discards_merged",
      description: "The number of discards merged.",
    },
    stats.map((blockStat) => ({
      labels: { name: blockStat.name },
      value: blockStat.stat.discardsMerged,
    }))
  );

  openMetrics.addGauge(
    {
      name: "sectors_discarded",
      description: "The number of sectors discarded per second.",
    },
    stats.map((blockStat) => ({
      labels: { name: blockStat.name },
      value: blockStat.stat.sectorsDiscarded,
    }))
  );

  openMetrics.addGauge(
    {
      name: "discard_time",
      description: "The percentage of time spent on discards.",
      unit: "ratio",
    },
    stats.map((blockStat) => ({
      labels: { name: blockStat.name },
      value: blockStat.stat.discardTime,
    }))
  );

  openMetrics.addGauge(
    {
      name: "flush_requests_completed",
      description: "The number of flush requests completed per second.",
    },
    stats.map((blockStat) => ({
      labels: { name: blockStat.name },
      value: blockStat.stat.flushRequestsCompleted,
    }))
  );

  openMetrics.addGauge(
    {
      name: "flush_time",
      description: "The percentage of time spent on flush requests.",
      unit: "ratio",
    },
    stats.map((blockStat) => ({
      labels: { name: blockStat.name },
      value: blockStat.stat.flushTime,
    }))
  );

  return openMetrics.toResponse();
};
