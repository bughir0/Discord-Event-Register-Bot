import type { Pool, PoolClient } from "pg";
import type { ParticipantRow } from "../../models/types.js";

function mapParticipant(r: Record<string, unknown>): ParticipantRow {
  return {
    id: String(r.id),
    event_id: String(r.event_id),
    user_id: String(r.user_id),
    clicked_button_at: r.clicked_button_at != null ? (r.clicked_button_at as Date) : null,
    first_message_at: r.first_message_at != null ? (r.first_message_at as Date) : null,
    last_message_at: r.last_message_at != null ? (r.last_message_at as Date) : null,
    message_count: Number(r.message_count),
    created_at: r.created_at as Date,
  };
}

export class ParticipantRepository {
  constructor(private readonly db: Pool | PoolClient) {}

  /**
   * Registra clique no botão. Idempotente: repetição retorna firstRegistration=false.
   * Cobre linha criada só por mensagens (preenche clicked_button_at se estava nulo).
   */
  async registerButtonClick(
    eventId: string,
    userId: string,
    at: Date,
  ): Promise<{ firstRegistration: boolean }> {
    const ins = await this.db.query(
      `INSERT INTO event_participants (event_id, user_id, clicked_button_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id) DO NOTHING
       RETURNING id`,
      [eventId, userId, at],
    );
    if (ins.rowCount && ins.rowCount > 0) {
      return { firstRegistration: true };
    }
    const upd = await this.db.query(
      `UPDATE event_participants
       SET clicked_button_at = $3
       WHERE event_id = $1 AND user_id = $2 AND clicked_button_at IS NULL
       RETURNING id`,
      [eventId, userId, at],
    );
    if (upd.rowCount && upd.rowCount > 0) {
      return { firstRegistration: true };
    }
    return { firstRegistration: false };
  }

  /**
   * Contabiliza mensagem durante o evento (canal já validado pelo caller).
   */
  async recordMessage(
    eventId: string,
    userId: string,
    at: Date,
  ): Promise<{ messageCount: number; wasNewParticipant: boolean }> {
    const existed = await this.db.query(
      `SELECT 1 FROM event_participants WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId],
    );
    const wasNewParticipant = existed.rows.length === 0;

    const res = await this.db.query(
      `INSERT INTO event_participants (event_id, user_id, message_count, first_message_at, last_message_at)
       VALUES ($1, $2, 1, $3, $3)
       ON CONFLICT (event_id, user_id) DO UPDATE SET
         message_count = event_participants.message_count + 1,
         first_message_at = COALESCE(event_participants.first_message_at, EXCLUDED.first_message_at),
         last_message_at = EXCLUDED.last_message_at
       RETURNING message_count`,
      [eventId, userId, at],
    );
    return {
      messageCount: Number(res.rows[0].message_count),
      wasNewParticipant,
    };
  }

  /** Já existe registro de clique no botão "participar" neste evento. */
  async hasButtonConfirmation(eventId: string, userId: string): Promise<boolean> {
    const res = await this.db.query(
      `SELECT 1 FROM event_participants
       WHERE event_id = $1 AND user_id = $2 AND clicked_button_at IS NOT NULL`,
      [eventId, userId],
    );
    return res.rows.length > 0;
  }

  /** Remove o participante deste evento. Retorna true se havia linha. */
  async deleteByEventAndUser(eventId: string, userId: string): Promise<boolean> {
    const res = await this.db.query(
      `DELETE FROM event_participants WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId],
    );
    return (res.rowCount ?? 0) > 0;
  }

  /** Existe qualquer registro de participação (botão e/ou mensagens). */
  async hasAnyParticipation(eventId: string, userId: string): Promise<boolean> {
    const res = await this.db.query(
      `SELECT 1 FROM event_participants WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId],
    );
    return res.rows.length > 0;
  }

  /**
   * Participantes da dinâmica (exclui o organizador — não entra na lista nem nas estatísticas).
   */
  async listByEvent(eventId: string): Promise<ParticipantRow[]> {
    const res = await this.db.query(
      `SELECT p.*
       FROM event_participants p
       INNER JOIN events e ON e.id = p.event_id
       WHERE p.event_id = $1 AND p.user_id <> e.organizer_id
       ORDER BY p.user_id`,
      [eventId],
    );
    return res.rows.map(mapParticipant);
  }

  /**
   * Quantos eventos distintos o membro participou neste servidor, por estado do evento.
   * Não conta eventos em que o membro é só o organizador (organizador não entra na dinâmica).
   */
  async participationCountsByMember(
    guildId: string,
    userId: string,
  ): Promise<{ ended: number; active: number }> {
    const res = await this.db.query(
      `SELECT
         COUNT(DISTINCT p.event_id) FILTER (WHERE e.status = 'ended')::int AS ended,
         COUNT(DISTINCT p.event_id) FILTER (WHERE e.status = 'active')::int AS active
       FROM event_participants p
       INNER JOIN events e ON e.id = p.event_id
       WHERE e.guild_id = $1 AND p.user_id = $2
         AND p.user_id <> e.organizer_id`,
      [guildId, userId],
    );
    const row = res.rows[0] as { ended: number; active: number };
    return { ended: row?.ended ?? 0, active: row?.active ?? 0 };
  }

  /** Ranking global de usuários por mensagens em eventos finalizados no período. */
  async rankingByGuildMonth(
    guildId: string,
    year: number,
    month: number,
    limit: number,
  ): Promise<{ user_id: string; total_messages: string; events_joined: string }[]> {
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
    const res = await this.db.query(
      `SELECT p.user_id,
              SUM(p.message_count)::text AS total_messages,
              COUNT(DISTINCT p.event_id)::text AS events_joined
       FROM event_participants p
       INNER JOIN events e ON e.id = p.event_id
       WHERE e.guild_id = $1 AND e.status = 'ended'
         AND e.ended_at >= $2 AND e.ended_at < $3
         AND p.user_id <> e.organizer_id
       GROUP BY p.user_id
       ORDER BY SUM(p.message_count) DESC NULLS LAST
       LIMIT $4`,
      [guildId, start, end, limit],
    );
    return res.rows as { user_id: string; total_messages: string; events_joined: string }[];
  }
}
