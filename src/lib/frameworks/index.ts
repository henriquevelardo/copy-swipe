import { tiktokShopFramework } from './tiktok-shop'
import { nonShopFramework } from './non-shop'
import { drFramework } from './dr'

export function getFramework(businessModel: string): string {
  switch (businessModel) {
    case 'TikTok Shop': return tiktokShopFramework
    case 'Non-shop': return nonShopFramework
    case 'DR': return drFramework
    default: return ''
  }
}
