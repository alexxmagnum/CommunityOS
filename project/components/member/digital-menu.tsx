'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { MenuCategory, MenuDish, TenantRestaurant } from '@/lib/org/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChefHat, Leaf, WheatOff, Sprout } from 'lucide-react'

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price)
}

function DietBadges({ dish }: { dish: MenuDish }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {dish.is_chef_special && (
        <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-900 hover:bg-amber-100">
          <ChefHat className="h-3 w-3" /> Especial del chef
        </Badge>
      )}
      {dish.is_vegan && (
        <Badge variant="outline" className="gap-1 text-xs">
          <Sprout className="h-3 w-3" /> Vegano
        </Badge>
      )}
      {dish.is_vegetarian && !dish.is_vegan && (
        <Badge variant="outline" className="gap-1 text-xs">
          <Leaf className="h-3 w-3" /> Vegetariano
        </Badge>
      )}
      {dish.is_gluten_free && (
        <Badge variant="outline" className="gap-1 text-xs">
          <WheatOff className="h-3 w-3" /> Sin gluten
        </Badge>
      )}
    </div>
  )
}

function DishCard({ dish }: { dish: MenuDish }) {
  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md ${
        dish.is_chef_special ? 'border-amber-200/80 ring-1 ring-amber-100' : 'border-border'
      }`}
    >
      {dish.image_url && (
        <div className="aspect-[16/10] overflow-hidden bg-muted">
          <img src={dish.image_url} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold leading-snug">{dish.name}</h3>
          <span className="shrink-0 text-sm font-semibold text-motanos">
            {formatPrice(dish.price)}
          </span>
        </div>
        {dish.description && (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{dish.description}</p>
        )}
        <DietBadges dish={dish} />
      </div>
    </article>
  )
}

export function DigitalMenu({
  restaurant,
  categories,
  dishes,
  reserveHref,
}: {
  restaurant: TenantRestaurant | null
  categories: MenuCategory[]
  dishes: MenuDish[]
  reserveHref: string
}) {
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order),
    [categories]
  )

  const filteredDishes = useMemo(() => {
    if (activeCategory === 'all') return dishes
    return dishes.filter((d) => d.category_id === activeCategory)
  }, [dishes, activeCategory])

  const chefSpecials = dishes.filter((d) => d.is_chef_special)

  return (
    <div className="space-y-10">
      <div className="menu-hero rounded-3xl border border-neutral-200/80 bg-gradient-to-br from-cyan-500/5 via-white to-lime-400/5 p-8 md:p-10">
        <p className="label-caps">Carta digital</p>
        <h1 className="font-display mt-2 text-3xl md:text-4xl">
          {restaurant?.name || 'Restaurante'}
        </h1>
        {restaurant?.description && (
          <p className="mt-3 max-w-2xl text-muted-foreground">{restaurant.description}</p>
        )}
        <Link href={reserveHref} className="mt-6 inline-block">
          <Button variant="ghost" className="btn-motanos h-11 px-8">
            Reservar mesa
          </Button>
        </Link>
      </div>

      {chefSpecials.length > 0 && activeCategory === 'all' && (
        <section>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Recomendados hoy
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {chefSpecials.map((dish) => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeCategory === 'all'
                ? 'pill-motanos-active'
                : 'border border-transparent bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Toda la carta
          </button>
          {sortedCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'pill-motanos-active'
                  : 'border border-transparent bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {filteredDishes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No hay platos en esta categoría.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDishes.map((dish) => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        )}
      </section>

      <div className="surface-elevated rounded-2xl border p-6 text-center">
        <p className="text-sm text-muted-foreground">¿Te apetece cenar en la terraza?</p>
        <Link href={reserveHref} className="mt-4 inline-block">
          <Button variant="ghost" className="btn-motanos">Reservar mesa ahora</Button>
        </Link>
      </div>
    </div>
  )
}
