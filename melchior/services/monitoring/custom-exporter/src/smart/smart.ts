import { spawn } from "bun";

type TermLsblk = {
  blockdevices: BlockDevice[];
};

type BlockDevice = {
  name: string;
  size: string;
  type: string;
};

export type TermSmartctlCommon = {
  name: string;
  device: {
    name: string;
    info_name: string;
    type: string;
    protocol: string;
  };
  model_name: string;
  serial_number: string;
  smart_support: {
    available: boolean;
    enabled: boolean;
  };
  smart_status: {
    passed: boolean;
  };
  temperature: {
    current: number;
  };
  power_cycle_count: number;
  power_on_time: {
    hours: number;
  };
  user_capacity: {
    blocks: number;
    bytes: number;
  };
};

type TermSmartctlSata = TermSmartctlCommon & {
  logical_block_size: number;
  physical_block_size: number;
  rotation_rate: number;
  form_factor: {
    ata_value: number;
    name: string;
  };
  interface_speed: {
    current: {
      string: string;
    };
  };
};

type TermSmartctlNvme = TermSmartctlCommon & {
  nvme_smart_health_information_log: {
    critical_warning: number;
    temperature: number;
    available_spare: number;
    available_spare_threshold: number;
    percentage_used: number;
    data_units_read: number;
    data_units_written: number;
    host_reads: number;
    host_writes: number;
    controller_busy_time: number;
    power_cycles: number;
    power_on_hours: number;
    unsafe_shutdowns: number;
    media_errors: number;
    num_err_log_entries: number;
    warning_temp_time: number;
    critical_comp_time: number;
    temperature_sensors: number[];
  };
  nvme_error_information_log: {
    size: number;
    read: number;
    unread: number;
  };
};

export class Smart {
  private constructor(
    readonly smartReport: TermSmartctlNvme | TermSmartctlSata
  ) {}

  get properties(): TermSmartctlNvme | TermSmartctlSata {
    return this.smartReport;
  }

  static async getAllSmartReports(): Promise<Smart[]> {
    const shellOutput = await spawn({
      cmd: ["lsblk", "--json", "--bytes", "--nodeps"],
    }).stdout.text();
    const response: TermLsblk = JSON.parse(shellOutput);
    const smartReports = await Promise.all(
      response.blockdevices.map(async (blockDevice) => {
        return {
          ...JSON.parse(
            await spawn({
              cmd: ["smartctl", "--json", "--all", `/dev/${blockDevice.name}`],
            }).stdout.text()
          ),
          name: blockDevice.name,
        };
      })
    );
    return smartReports.map((smartReport) => new Smart(smartReport));
  }

  static filterOnlyHdds(
    smartReports: (TermSmartctlNvme | TermSmartctlSata)[]
  ): TermSmartctlSata[] {
    return smartReports.filter(
      (smartReport) =>
        smartReport.device.type === "sat" &&
        smartReport.device.protocol === "ATA"
    ) as TermSmartctlSata[];
  }

  static filterOnlyNvmes(
    smartReports: (TermSmartctlNvme | TermSmartctlSata)[]
  ): TermSmartctlNvme[] {
    return smartReports.filter(
      (smartReport) =>
        smartReport.device.type === "nvme" &&
        smartReport.device.protocol === "NVMe"
    ) as TermSmartctlNvme[];
  }
}
