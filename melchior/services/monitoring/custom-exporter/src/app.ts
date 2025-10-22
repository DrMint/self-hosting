import { zfsEndpoint } from "./zfs/endpoint";
import { hddEndpoint } from "./smart/endpoint";
import { ssdEndpoint } from "./smart/endpoint";
import { zpoolEndpoint } from "./zpool/endpoint";
import { hwmonEndpoint } from "./hwmon/endpoint";
import { sysinfoEndpoint } from "./sysinfo/endpoint";
import { blockStatEndpoint } from "./blockStat/endpoint";

Bun.serve({
  port: 8000,
  fetch: (request) => {
    const pathname = new URL(request.url).pathname;
    switch (pathname) {
      case "/blockstat":
        return blockStatEndpoint();
      case "/sysinfo":
        return sysinfoEndpoint();
      case "/hwmon":
        return hwmonEndpoint();
      case "/zpool":
        return zpoolEndpoint();
      case "/zfs":
        return zfsEndpoint();
      case "/smart/hdd":
        return hddEndpoint();
      case "/smart/ssd":
        return ssdEndpoint();
      default:
        return new Response("Not found", { status: 404 });
    }
  },
  hostname: "0.0.0.0",
});
