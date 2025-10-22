import { spawn } from "bun";

export type TermZfsGet = {
  output_version: {
    command: string;
    vers_major: number;
    vers_minor: number;
  };
  datasets: Record<TermZfsDatasetNames, TermZfsDataset>;
};

type TermZfsDatasetNames = string;

type TermZfsDataset = {
  name: string;
  type: string;
  pool: string;
  createtxg: string;
  properties: Record<TermZfsPropertyNames, TermZfsProperty>;
};

/* https://openzfs.github.io/openzfs-docs/man/master/7/zfsprops.7.html */
type TermZfsPropertyNames =
  | "type"
  | "creation"
  | "used"
  | "available"
  | "referenced"
  | "compressratio"
  | "mounted"
  | "quota"
  | "reservation"
  | "recordsize"
  | "mountpoint"
  | "sharenfs"
  | "checksum"
  | "compression"
  | "atime"
  | "devices"
  | "exec"
  | "setuid"
  | "readonly"
  | "zoned"
  | "snapdir"
  | "aclmode"
  | "aclinherit"
  | "createtxg"
  | "canmount"
  | "xattr"
  | "copies"
  | "version"
  | "utf8only"
  | "normalization"
  | "casesensitivity"
  | "vscan"
  | "nbmand"
  | "sharesmb"
  | "refquota"
  | "refreservation"
  | "guid"
  | "primarycache"
  | "secondarycache"
  | "usedbysnapshots"
  | "usedbydataset"
  | "usedbychildren"
  | "usedbyrefreservation"
  | "logbias"
  | "objsetid"
  | "dedup"
  | "mlslabel"
  | "sync"
  | "dnodesize"
  | "refcompressratio"
  | "written"
  | "logicalused"
  | "logicalreferenced"
  | "volmode"
  | "filesystem_limit"
  | "snapshot_limit"
  | "filesystem_count"
  | "snapshot_count"
  | "snapdev"
  | "acltype"
  | "context"
  | "fscontext"
  | "defcontext"
  | "rootcontext"
  | "relatime"
  | "redundant_metadata"
  | "overlay"
  | "encryption"
  | "keylocation"
  | "keyformat"
  | "pbkdf2iters"
  | "special_small_blocks"
  | "prefetch"
  | "direct"
  | "longname";

type TermZfsProperty = {
  value: string;
  source: {
    type: string;
    data: string;
  };
};

export class ZfsDataset {
  private constructor(readonly dataset: TermZfsDataset) {}
  get properties(): Record<TermZfsPropertyNames, TermZfsProperty> {
    return this.dataset.properties;
  }
  static async getAllDatasets(): Promise<ZfsDataset[]> {
    const shellOutput = await spawn({
      cmd: ["zfs", "get", "all", "--json", "-p", "-t", "filesystem"],
    }).stdout.text();
    const response: TermZfsGet = JSON.parse(shellOutput);
    return Object.values(response.datasets).flatMap((dataset) => {
      return new ZfsDataset(dataset);
    });
  }
}
