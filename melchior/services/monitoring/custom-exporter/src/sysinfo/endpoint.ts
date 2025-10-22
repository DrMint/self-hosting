import si from "systeminformation";
import { OpenMetrics } from "../common/open-metrics";
import { $ } from "bun";

export const sysinfoEndpoint = async (): Promise<Response> => {
  const [load, memory, cpuCurrentSpeed, fsSize, arc_size, arc_min_size] =
    await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.cpuCurrentSpeed(),
      si.fsSize(),
      $`grep "^size" /proc/spl/kstat/zfs/arcstats | awk '{print $3}'`
        .text()
        .then(Number),
      $`grep c_min /proc/spl/kstat/zfs/arcstats | awk '{print $3}'`
        .text()
        .then(Number),
    ]);

  const available =
    memory.available + (arc_size > arc_min_size ? arc_size - arc_min_size : 0);
  const total = memory.total;
  const used = total - available;

  const sysInfo = new OpenMetrics("sysinfo");
  sysInfo.addGauge(
    {
      name: "cpu_load",
      description: "The load on the CPU.",
      unit: "ratio",
    },
    [{ value: load.currentLoad / 100 }]
  );

  sysInfo.addGauge(
    {
      name: "cpu_cores_load",
      description: "The load on each CPU core.",
      unit: "ratio",
    },
    load.cpus.map((cpu, index) => ({
      labels: { core: `C${index}` },
      value: cpu.load / 100,
    }))
  );

  sysInfo.addGauge(
    {
      name: "cpu_cores_speed",
      description: "The speed of the CPU cores.",
      unit: "hertz",
    },
    cpuCurrentSpeed.cores.map((value, index) => ({
      labels: { core: `C${index}` },
      value: value * 1000 * 1000 * 1000,
    }))
  );

  sysInfo.addGauge(
    {
      name: "memory_total",
      description: "The total amount of memory.",
      unit: "bytes",
    },
    [{ value: total }]
  );

  sysInfo.addGauge(
    {
      name: "memory_available",
      description: "The available amount of memory.",
      unit: "bytes",
    },
    [{ value: available }]
  );

  sysInfo.addGauge(
    {
      name: "memory_used",
      description: "The used amount of memory.",
      unit: "bytes",
    },
    [{ value: used }]
  );

  sysInfo.addGauge(
    {
      name: "fs_used",
      description: "Used size of the file system.",
      unit: "bytes",
    },
    fsSize.map((fs) => ({
      labels: { name: fs.fs },
      value: fs.used,
    }))
  );

  sysInfo.addGauge(
    {
      name: "fs_available",
      description: "Available size of the file system.",
      unit: "bytes",
    },
    fsSize.map((fs) => ({
      labels: { name: fs.fs },
      value: fs.available,
    }))
  );

  return sysInfo.toResponse();
};
