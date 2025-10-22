import { OpenMetrics } from "../common/open-metrics";
import { Hwmon } from "./hwmon";

export const hwmonEndpoint = async (): Promise<Response> => {
  const hwmon = await Hwmon.getHwmon();
  const openMetrics = new OpenMetrics("hwmon");

  openMetrics.addGauge(
    {
      name: "temperature",
      description: "The temperature of the device.",
      unit: "celsius",
    },
    hwmon.temperatures.map((temperature) => ({
      labels: { name: temperature.name, device: temperature.device },
      value: temperature.value,
    }))
  );

  return openMetrics.toResponse();
};
