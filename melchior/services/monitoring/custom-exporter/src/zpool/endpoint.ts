import { OpenMetrics } from "../common/open-metrics";
import { ZPool } from "./zpool";

export const zpoolEndpoint = async (): Promise<Response> => {
  const zpools = await ZPool.getAllZpool();
  const openMetrics = new OpenMetrics("zpool");

  openMetrics.addCounter(
    {
      name: "pool_error",
      description: "The number of errors on the pool.",
    },
    zpools.map((zpool) => ({
      labels: { pool: zpool.properties.name, state: zpool.properties.state },
      value: zpool.properties.error_count,
    }))
  );

  openMetrics.addInfo(
    {
      name: "vdev_state",
      description: "The state of the vdevs in the pool.",
    },
    zpools.flatMap((zpool) =>
      zpool.vdevs.map((vdev) => ({
        pool: vdev.pool,
        vdev: vdev.name,
        state: vdev.state,
        type: vdev.vdev_type,
      }))
    )
  );

  openMetrics.addInfo(
    {
      name: "disk_state",
      description: "The state of the disks in the vdevs.",
    },
    zpools.flatMap((zpool) =>
      zpool.disks.map((disk) => ({
        pool: disk.pool,
        vdev: disk.vdev,
        disk: disk.name,
        state: disk.state,
        type: disk.vdev_type,
        ...("devid" in disk && { devid: disk.devid }),
        ...("phys_path" in disk && { phys_path: disk.phys_path }),
        ...("path" in disk && { path: disk.path }),
      }))
    )
  );

  openMetrics.addCounter(
    {
      name: "disk_error_count",
      description: "The number of errors on the disk.",
    },
    zpools.flatMap((zpool) =>
      zpool.disks.map((disk) => ({
        labels: { disk: disk.name, pool: disk.pool, vdev: disk.vdev },
        value:
          disk.read_errors +
          disk.write_errors +
          disk.checksum_errors +
          (disk.trim_errors ?? 0) +
          (disk.slow_ios ?? 0),
      }))
    )
  );

  openMetrics.addCounter(
    {
      name: "disk_read_errors",
      description: "The number of read errors on the disk.",
    },
    zpools.flatMap((zpool) =>
      zpool.disks.map((disk) => ({
        labels: { disk: disk.name, pool: disk.pool, vdev: disk.vdev },
        value: disk.read_errors,
      }))
    )
  );

  openMetrics.addCounter(
    {
      name: "disk_write_errors",
      description: "The number of write errors on the disk.",
    },
    zpools.flatMap((zpool) =>
      zpool.disks.map((disk) => ({
        labels: { disk: disk.name, pool: disk.pool, vdev: disk.vdev },
        value: disk.write_errors,
      }))
    )
  );

  openMetrics.addCounter(
    {
      name: "disk_checksum_errors",
      description: "The number of checksum errors on the disk.",
    },
    zpools.flatMap((zpool) =>
      zpool.disks.map((disk) => ({
        labels: { disk: disk.name, pool: disk.pool, vdev: disk.vdev },
        value: disk.checksum_errors,
      }))
    )
  );

  openMetrics.addCounter(
    {
      name: "disk_slow_ios",
      description: "The number of slow IOs on the disk.",
    },
    zpools.flatMap((zpool) =>
      zpool.disks.flatMap((disk) =>
        disk.slow_ios !== undefined
          ? [
              {
                labels: { disk: disk.name, pool: disk.pool, vdev: disk.vdev },
                value: disk.slow_ios,
              },
            ]
          : []
      )
    )
  );

  openMetrics.addBoolean(
    {
      name: "disk_trim_supported",
      description: "Whether the disk supports trim.",
    },
    zpools.flatMap((zpool) =>
      zpool.disks.map((disk) => ({
        labels: { disk: disk.name, pool: disk.pool, vdev: disk.vdev },
        value: disk.trim_notsup === 0,
      }))
    )
  );

  openMetrics.addCounter(
    {
      name: "disk_trim_errors",
      description: "The number of trim errors on the disk.",
    },
    zpools.flatMap((zpool) =>
      zpool.disks.flatMap((disk) =>
        disk.trim_errors !== undefined
          ? [
              {
                labels: { disk: disk.name, pool: disk.pool, vdev: disk.vdev },
                value: disk.trim_errors,
              },
            ]
          : []
      )
    )
  );

  openMetrics.addInfo(
    {
      name: "disk_trim_state",
      description: "The state of the trim on the disk.",
    },
    zpools.flatMap((zpool) =>
      zpool.disks.flatMap((disk) =>
        disk.trim_state !== undefined && disk.trim_time !== undefined
          ? [
              {
                disk: disk.name,
                pool: disk.pool,
                vdev: disk.vdev,
                trim_state: disk.trim_state,
                trim_time: new Date(
                  Number(disk.trim_time) * 1000
                ).toISOString(),
              },
            ]
          : []
      )
    )
  );

  return openMetrics.toResponse();
};
