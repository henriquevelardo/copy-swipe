import { tiktokShopFramework } from './tiktok-shop'
import { nonShopFramework } from './non-shop'
import { dtcFramework } from './dtc'

export function getFramework(businessModel: string): string {
  switch (businessModel) {
    case 'TikTok Shop': return tiktokShopFramework
    case 'Non-shop': return nonShopFramework
    case 'DTC': return dtcFramework
    default: return ''
  }
}
