import type { Client } from "discord.js";
import type { Pool } from "pg";
import { EventService } from "./services/event.service.js";
import { ExportService } from "./services/export.service.js";
import { LoggerService } from "./services/logger.service.js";
import { ReportService } from "./services/report.service.js";

/** Serviços compartilhados (injção manual para manter simplicidade sem framework DI). */
export class BotContext {
  readonly eventService: EventService;
  readonly reportService: ReportService;
  readonly exportService: ExportService;
  readonly logger: LoggerService;

  constructor(
    readonly client: Client,
    readonly pool: Pool,
  ) {
    this.eventService = new EventService(pool);
    this.reportService = new ReportService(pool);
    this.exportService = new ExportService(pool);
    this.logger = new LoggerService(client, pool);
  }
}
