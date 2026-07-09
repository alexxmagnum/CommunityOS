import { DEFAULT_ORG_SLUG } from '@/lib/constants'
import { getSupabaseClient } from '@/lib/supabase/client'
import { DEMO_MENU_CATEGORIES, DEMO_MENU_DISHES, DEMO_RESTAURANT } from './demo-menu'
import { isSupabaseConfigured } from './is-supabase-configured'
import { localizeMenuCategory, localizeDish } from '@/lib/i18n/content'
import { resolveAppLocale } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/types'
import type { MenuCategory, MenuDish, TenantMenuData } from './types'

export async function loadTenantMenu(
  slug = DEFAULT_ORG_SLUG,
  options?: { locale?: Locale }
): Promise<TenantMenuData> {
  if (!isSupabaseConfigured()) {
    return {
      restaurant: DEMO_RESTAURANT,
      categories: DEMO_MENU_CATEGORIES,
      dishes: DEMO_MENU_DISHES,
      demoMode: true,
    }
  }

  const supabase = getSupabaseClient()

  const { data: orgData } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (!orgData) {
    return {
      restaurant: DEMO_RESTAURANT,
      categories: DEMO_MENU_CATEGORIES,
      dishes: DEMO_MENU_DISHES,
      demoMode: true,
    }
  }

  const locale = options?.locale ?? resolveAppLocale()

  const [restaurantRes, categoriesRes, dishesRes] = await Promise.all([
    supabase
      .from('restaurants')
      .select('id, name, description')
      .eq('organization_id', orgData.id)
      .eq('is_active', true)
      .order('name')
      .limit(1)
      .maybeSingle(),
    supabase
      .from('menu_categories')
      .select('id, name, sort_order')
      .eq('organization_id', orgData.id)
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('dishes')
      .select('id, category_id, name, description, price, image_url, is_chef_special, is_vegetarian, is_vegan, is_gluten_free, is_available, sort_order')
      .eq('organization_id', orgData.id)
      .eq('is_available', true)
      .order('sort_order'),
  ])

  const categories: MenuCategory[] = (categoriesRes.data || []).map((c) =>
    localizeMenuCategory(locale, {
      id: c.id,
      name: c.name,
      sort_order: c.sort_order ?? 0,
    })
  )

  const dishes: MenuDish[] = (dishesRes.data || []).map((d) =>
    localizeDish(locale, {
      id: d.id,
      category_id: d.category_id,
      name: d.name,
      description: d.description,
      price: Number(d.price),
      image_url: d.image_url,
      is_chef_special: d.is_chef_special ?? false,
      is_vegetarian: d.is_vegetarian ?? false,
      is_vegan: d.is_vegan ?? false,
      is_gluten_free: d.is_gluten_free ?? false,
      is_available: d.is_available ?? true,
    })
  )

  return {
    restaurant: restaurantRes.data
      ? {
          id: restaurantRes.data.id,
          name: restaurantRes.data.name,
          description: restaurantRes.data.description,
        }
      : null,
    categories,
    dishes,
    demoMode: false,
  }
}
