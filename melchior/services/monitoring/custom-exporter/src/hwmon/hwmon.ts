import { spawn } from "bun";

type TermHwmon = {
  /* CPU - AMD Ryzen */
  "k10temp-pci-00c3": {
    Adapter: string;
    Tctl: {
      temp1_input: number;
    };
  };
  /* iGPU */
  "amdgpu-pci-0d00": {
    Adapter: string;
    edge: {
      temp1_input: number;
    };
  };
  /* nvme-CT500P310SSD8_25164FAF1C4F nvme0n1 */
  "nvme-pci-0400": {
    Adapter: string;
    Composite: {
      temp1_input: number;
      temp1_max: number;
      temp1_crit: number;
    };
  };
  /* nvme-Samsung_SSD_970_EVO_Plus_500GB_S4EVNF0M698680B nvme1n1 */
  "nvme-pci-0500": {
    Adapter: string;
    Composite: {
      temp1_input: number;
      temp1_max: number;
      temp1_crit: number;
    };
  };
  /* nvme-CT500P310SSD8_25064E89A503 nvme2n1 */
  "nvme-pci-0c00": {
    Adapter: string;
    Composite: {
      temp1_input: number;
      temp1_max: number;
      temp1_crit: number;
    };
  };
  /* RAM */
  "spd5118-i2c-2-53": {
    Adapter: string;
    temp1: {
      temp1_input: number;
      temp1_max: number;
      temp1_crit: number;
    };
  };
};

export class Hwmon {
  private constructor(readonly hwmon: TermHwmon) {}

  get temperatures(): { name: string; device: string; value: number }[] {
    return [
      {
        name: "cpu",
        device: "Ryzen 7 9700X",
        value: this.hwmon["k10temp-pci-00c3"].Tctl.temp1_input,
      },
      {
        name: "igpu",
        device: "Radeon Graphics",
        value: this.hwmon["amdgpu-pci-0d00"].edge.temp1_input,
      },
      {
        name: "nvme0n1",
        device: "CT500P310SSD8_25164FAF1C4F",
        value: this.hwmon["nvme-pci-0400"].Composite.temp1_input,
      },
      {
        name: "nvme1n1",
        device: "Samsung_SSD_970_EVO_Plus_500GB_S4EVNF0M698680B",
        value: this.hwmon["nvme-pci-0500"].Composite.temp1_input,
      },
      {
        name: "nvme2n1",
        device: "CT500P310SSD8_25064E89A503",
        value: this.hwmon["nvme-pci-0c00"].Composite.temp1_input,
      },
      {
        name: "ram",
        device: "Kingston Server Premier - KSM56E46BD8KM-32HA",
        value: this.hwmon["spd5118-i2c-2-53"].temp1.temp1_input,
      },
    ];
  }

  static async getHwmon(): Promise<Hwmon> {
    const shellOutput = await spawn({
      cmd: ["sensors", "-j"],
    }).stdout.text();
    const response: TermHwmon = JSON.parse(shellOutput);
    return new Hwmon(response);
  }
}
