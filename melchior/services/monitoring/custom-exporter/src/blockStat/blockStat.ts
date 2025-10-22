import { spawn } from "bun";

type BlockStatObject = {
  /** Number of reads completed successfully. */
  readsCompleted: number;

  /** Number of reads merged. Reads which are adjacent to each other may be merged for efficiency. */
  readsMerged: number;

  /** Number of sectors read successfully. */
  sectorsRead: number;

  /** Number of milliseconds spent by all reads. */
  readTime: number;

  /** Number of writes completed successfully. */
  writesCompleted: number;

  /** Number of writes merged. Writes which are adjacent to each other may be merged for efficiency. */
  writesMerged: number;

  /** Number of sectors written successfully. */
  sectorsWritten: number;

  /** Number of milliseconds spent by all writes. */
  writeTime: number;

  /** Number of I/Os currently in progress. The only field that should go to zero. */
  iopsInProgress: number;

  /** Number of milliseconds spent doing I/Os. */
  ioTime: number;

  /** Weighted number of milliseconds spent doing I/Os. */
  weightedIoTime: number;

  /** Number of discards completed successfully. */
  discardsCompleted: number;

  /** Number of discards merged. Discards which are adjacent to each other may be merged for efficiency. */
  discardsMerged: number;

  /** Number of sectors discarded successfully. */
  sectorsDiscarded: number;

  /** Number of milliseconds spent by all discards. */
  discardTime: number;

  /** Number of flush requests completed successfully. */
  flushRequestsCompleted: number;

  /** Number of milliseconds spent by all flush requests. */
  flushTime: number;
};

type BlockStatDeltaObject = Omit<BlockStatObject, "iopsInProgress">;

export class BlockStat {
  private stat: BlockStatObject;
  private time: number;

  private previousStat: BlockStatObject | undefined;
  private previousTime: number | undefined;

  constructor(readonly name: string, stat: BlockStatObject, time: number) {
    this.stat = stat;
    this.time = time;
  }

  async refresh() {
    const now = Date.now();
    this.previousStat = this.stat;
    this.previousTime = this.time;
    this.stat = await BlockStat.getBlockStat(this.name);
    this.time = now;
  }

  get iopsInProgress(): number {
    return this.stat.iopsInProgress;
  }

  get delta(): BlockStatDeltaObject {
    if (this.previousStat === undefined || this.previousTime === undefined) {
      return {
        readsCompleted: 0,
        readsMerged: 0,
        sectorsRead: 0,
        readTime: 0,
        writesCompleted: 0,
        writesMerged: 0,
        sectorsWritten: 0,
        writeTime: 0,
        ioTime: 0,
        weightedIoTime: 0,
        discardsCompleted: 0,
        discardsMerged: 0,
        sectorsDiscarded: 0,
        discardTime: 0,
        flushRequestsCompleted: 0,
        flushTime: 0,
      };
    }

    const a = this.stat;
    const b = this.previousStat;
    // Delta time in seconds
    const dt = (this.time - this.previousTime) / 1000;

    return {
      readsCompleted: (a.readsCompleted - b.readsCompleted) / dt,
      readsMerged: (a.readsMerged - b.readsMerged) / dt,
      sectorsRead: (a.sectorsRead - b.sectorsRead) / dt,
      readTime: (a.readTime - b.readTime) / 1000 / dt,
      writesCompleted: (a.writesCompleted - b.writesCompleted) / dt,
      writesMerged: (a.writesMerged - b.writesMerged) / dt,
      sectorsWritten: (a.sectorsWritten - b.sectorsWritten) / dt,
      writeTime: (a.writeTime - b.writeTime) / 1000 / dt,
      ioTime: (a.ioTime - b.ioTime) / 1000 / dt,
      weightedIoTime: (a.weightedIoTime - b.weightedIoTime) / 1000 / dt,
      discardsCompleted: (a.discardsCompleted - b.discardsCompleted) / dt,
      discardsMerged: (a.discardsMerged - b.discardsMerged) / dt,
      sectorsDiscarded: (a.sectorsDiscarded - b.sectorsDiscarded) / dt,
      discardTime: (a.discardTime - b.discardTime) / 1000 / dt,
      flushRequestsCompleted:
        (a.flushRequestsCompleted - b.flushRequestsCompleted) / dt,
      flushTime: (a.flushTime - b.flushTime) / 1000 / dt,
    };
  }

  static async getBlocksStat(): Promise<BlockStat[]> {
    const now = Date.now();
    const blockNames = await this.getAllBlockNames();
    const blockStats = await Promise.all(
      blockNames.map(async (blockName) => {
        const blockStat = await this.getBlockStat(blockName);
        return { blockName, blockStat };
      })
    );

    return blockStats.map(
      ({ blockName, blockStat }) => new BlockStat(blockName, blockStat, now)
    );
  }

  private static async getAllBlockNames(): Promise<string[]> {
    const blockNames = await spawn({
      cmd: ["ls", "-1", "/sys/block"],
    }).stdout.text();
    return blockNames.split("\n").filter((blockName) => blockName !== "");
  }

  private static async getBlockStat(
    blockName: string
  ): Promise<BlockStatObject> {
    const blockStat = await spawn({
      cmd: ["cat", `/sys/block/${blockName}/stat`],
    }).stdout.text();
    return this.parseBlockStat(blockStat);
  }

  private static parseBlockStat(blockStat: string) {
    // Remove ending \n
    blockStat = blockStat.replaceAll("\n", "");
    // Only keep one space between numbers
    blockStat = blockStat.replaceAll(/\s+/g, " ");
    // Remove the first space
    blockStat = blockStat.replaceAll(/^\s+/g, "");
    // Split into array
    const metrics = blockStat.split(" ");
    return {
      readsCompleted: Number(metrics[0]),
      readsMerged: Number(metrics[1]),
      sectorsRead: Number(metrics[2]),
      readTime: Number(metrics[3]),
      writesCompleted: Number(metrics[4]),
      writesMerged: Number(metrics[5]),
      sectorsWritten: Number(metrics[6]),
      writeTime: Number(metrics[7]),
      iopsInProgress: Number(metrics[8]),
      ioTime: Number(metrics[9]),
      weightedIoTime: Number(metrics[10]),
      discardsCompleted: Number(metrics[11]),
      discardsMerged: Number(metrics[12]),
      sectorsDiscarded: Number(metrics[13]),
      discardTime: Number(metrics[14]),
      flushRequestsCompleted: Number(metrics[15]),
      flushTime: Number(metrics[16]),
    };
  }
}
