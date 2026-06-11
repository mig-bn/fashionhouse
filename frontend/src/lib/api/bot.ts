import apiClient from './client'

export interface BotInteraction {
  id: string
  channel: 'WHATSAPP' | 'TELEGRAM'
  externalId: string
  senderName: string | null
  incomingMsg: string
  botResponse: string | null
  intent: 'ORDER_STATUS' | 'QUOTATION_STATUS' | 'HUMAN_HANDOFF' | 'UNKNOWN'
  transferred: boolean
  resolved: boolean
  customerId: string | null
  customerName: string | null
  createdAt: string
}

export interface BotStats {
  total: number
  pending: number
  resolved: number
  transferRate: number
}

export const botApi = {
  async getStats(): Promise<BotStats> {
    const res = await apiClient.get('/admin/bot/stats')
    return res.data.data
  },

  async getInteractions(page = 0, size = 20, pending = false) {
    const res = await apiClient.get('/admin/bot', {
      params: { page, size, pending },
    })
    return res.data.data // { content, totalElements, totalPages, ... }
  },

  async getById(id: string): Promise<BotInteraction> {
    const res = await apiClient.get(`/admin/bot/${id}`)
    return res.data.data
  },

  async markResolved(id: string): Promise<BotInteraction> {
    const res = await apiClient.patch(`/admin/bot/${id}/resolve`)
    return res.data.data
  },
}
