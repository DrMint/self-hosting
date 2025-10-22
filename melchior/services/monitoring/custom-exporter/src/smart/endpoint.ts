import { OpenMetrics } from "../common/open-metrics";
import { Smart, type TermSmartctlCommon } from "./smart";

export const hddEndpoint = async (): Promise<Response> => {
  const smarts = await Smart.getAllSmartReports();
  const smartReports = smarts.map((smart) => smart.properties);
  const hdds = Smart.filterOnlyHdds(smartReports);

  const openMetrics = new OpenMetrics("smart_hdd");
  commonSmartMetrics(hdds, openMetrics);

  openMetrics.addGauge(
    {
      name: "rotation_rate",
      description: "The rotation rate of the device.",
      unit: "rpm",
    },
    hdds.map((hdd) => ({
      labels: { device: hdd.name },
      value: hdd.rotation_rate,
    }))
  );

  openMetrics.addGauge(
    {
      name: "block_size",
      description: "The physical block size of the device.",
    },
    hdds.map((hdd) => ({
      labels: { device: hdd.name },
      value: hdd.physical_block_size,
    }))
  );

  openMetrics.addInfo(
    {
      name: "form_factor",
      description: "The form factor of the device.",
    },
    hdds.map((hdd) => ({
      device: hdd.name,
      form_factor: hdd.form_factor.name,
    }))
  );

  openMetrics.addInfo(
    {
      name: "interface_speed",
      description: "The current interface speed of the device.",
    },
    hdds.map((hdd) => ({
      device: hdd.name,
      interface_speed: hdd.interface_speed.current.string,
    }))
  );

  return openMetrics.toResponse();
};

export const ssdEndpoint = async (): Promise<Response> => {
  const smarts = await Smart.getAllSmartReports();
  const smartReports = smarts.map((smart) => smart.properties);
  const ssds = Smart.filterOnlyNvmes(smartReports);
  const openMetrics = new OpenMetrics("smart_ssd");
  commonSmartMetrics(ssds, openMetrics);

  openMetrics.addBoolean(
    {
      name: "reliability_ok",
      description: "Whether the device is free of critical warnings.",
    },
    ssds.map((ssd) => ({
      labels: { device: ssd.name },
      value: ssd.nvme_smart_health_information_log.critical_warning === 0,
    }))
  );

  openMetrics.addGauge(
    {
      name: "lifetime_remaining",
      description: "Simple estimate of the remaining health of the device.",
      unit: "ratio",
    },
    ssds.map((ssd) => ({
      labels: { device: ssd.name },
      value: 1 - ssd.nvme_smart_health_information_log.percentage_used / 100,
    }))
  );

  openMetrics.addGauge(
    {
      name: "available_spare",
      description: "The percentage of spare blocks available.",
      unit: "ratio",
    },
    ssds.map((ssd) => ({
      labels: { device: ssd.name },
      value: ssd.nvme_smart_health_information_log.available_spare / 100,
    }))
  );

  openMetrics.addGauge(
    {
      name: "available_spare_threshold",
      description:
        "The threshold at which the percentage of spare blocks available is considered low.",
      unit: "ratio",
    },
    ssds.map((ssd) => ({
      labels: { device: ssd.name },
      value:
        ssd.nvme_smart_health_information_log.available_spare_threshold / 100,
    }))
  );

  openMetrics.addCounter(
    {
      name: "unsafe_shutdowns",
      description: "The number of unsafe shutdowns.",
    },
    ssds.map((ssd) => ({
      labels: { device: ssd.name },
      value: ssd.nvme_smart_health_information_log.unsafe_shutdowns,
    }))
  );

  openMetrics.addCounter(
    {
      name: "media_errors",
      description: "The number of media errors.",
    },
    ssds.map((ssd) => ({
      labels: { device: ssd.name },
      value: ssd.nvme_smart_health_information_log.media_errors,
    }))
  );

  openMetrics.addCounter(
    {
      name: "num_err_log_entries",
      description: "The number of error log entries.",
    },
    ssds.map((ssd) => ({
      labels: { device: ssd.name },
      value: ssd.nvme_smart_health_information_log.num_err_log_entries,
    }))
  );

  return openMetrics.toResponse();
};

const commonSmartMetrics = (
  reports: TermSmartctlCommon[],
  openMetrics: OpenMetrics
) => {
  openMetrics.addInfo(
    {
      name: "device",
      description: "Common device information.",
    },
    reports.map((report) => ({
      device: report.name,
      model_name: report.model_name,
      serial_number: report.serial_number,
      type: report.device.type,
      protocol: report.device.protocol,
    }))
  );

  openMetrics.addGauge(
    {
      name: "temperature",
      description: "The temperature of the HDD.",
      unit: "celsius",
    },
    reports.map((report) => ({
      labels: { device: report.name },
      value: report.temperature.current,
    }))
  );

  openMetrics.addCounter(
    {
      name: "power_cycle_count",
      description: "The number of power cycles.",
    },
    reports.map((report) => ({
      labels: { device: report.name },
      value: report.power_cycle_count,
    }))
  );

  openMetrics.addGauge(
    {
      name: "power_on_time",
      description: "The time the device has been powered on.",
      unit: "seconds",
    },
    reports.map((report) => ({
      labels: { device: report.name },
      value: report.power_on_time.hours * 3600,
    }))
  );

  openMetrics.addGauge(
    {
      name: "user_capacity",
      description: "The capacity of the device.",
      unit: "bytes",
    },
    reports.map((report) => ({
      labels: { device: report.name },
      value: report.user_capacity.bytes,
    }))
  );

  openMetrics.addBoolean(
    {
      name: "smart_passed",
      description: "Whether the device passed the SMART self-tests.",
    },
    reports.map((report) => ({
      labels: { device: report.name },
      value: report.smart_status.passed,
    }))
  );
};
