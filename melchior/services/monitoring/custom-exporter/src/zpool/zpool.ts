import { spawn } from "bun";

type TermZpoolStatus = {
  output_version: {
    command: string;
    vers_major: number;
    vers_minor: number;
  };
  pools: Record<TermZpoolNames, TermZpool>;
};

type TermZpoolNames = string;

type TermZpool = {
  name: string;
  state: string;
  pool_guid: number;
  txg: number;
  spa_version: number;
  zpl_version: number;
  vdevs: Record<TermZpoolVdevsNames, TermZpoolVdevs>;
  error_count: number;
};

type TermZpoolVdevsNames = string;

type TermZpoolVdevs = {
  name: string;
  vdev_type: string;
  guid: number;
  class: string;
  state: string;
  alloc_space: number;
  total_space: number;
  def_space: number;
  read_errors: number;
  write_errors: number;
  checksum_errors: number;
  slow_ios?: number;

  trim_notsup: number;
  trim_state?: string;
  trimmed?: number;
  to_trim?: number;
  trim_time?: number;
  trim_errors?: number;

  rep_dev_size?: number;
  path?: string;
  phys_path?: string;
  devid?: string;
  phys_space?: number;
  vdevs?: Record<TermZpoolVdevsNames, TermZpoolVdevs>;
};

export class ZPool {
  private constructor(readonly zpool: TermZpool) {}

  get properties(): TermZpool {
    return this.zpool;
  }

  get vdevs(): (TermZpoolVdevs & { pool: string })[] {
    return Object.values(this.zpool.vdevs).flatMap((rootVdev) =>
      Object.values(rootVdev.vdevs ?? {}).map((vdev) => ({
        ...vdev,
        pool: this.zpool.name,
      }))
    );
  }

  get disks(): (TermZpoolVdevs & { pool: string; vdev: string })[] {
    return this.vdevs.flatMap((vdev) =>
      Object.values(vdev.vdevs ?? {})
        .flatMap((vdev) => vdev)
        .filter((vdev) => vdev.vdev_type === "disk")
        .map((disk) => ({ ...disk, vdev: vdev.name, pool: this.zpool.name }))
    );
  }

  static async getAllZpool(): Promise<ZPool[]> {
    const shellOutput = await spawn({
      cmd: ["zpool", "status", "--json", "--json-int", "-t", "-p"],
    }).stdout.text();
    const response: TermZpoolStatus = JSON.parse(shellOutput);
    return Object.values(response.pools).flatMap((zpool) => {
      return new ZPool(zpool);
    });
  }
}
