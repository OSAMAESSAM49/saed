// الأيقونات المتاحة للفئات (الأدمن بيختار منها بالاسم)
// لإضافة أيقونة: استوردها من lucide-react وضيفها في CATEGORY_ICONS
import {
  Stethoscope, HeartHandshake, BookOpenText, GraduationCap, SprayCan, Wrench, CarTaxiFront, Truck,
  Scissors, Sparkles, Briefcase, Wheat, Smartphone, PartyPopper, ClipboardList, LayoutGrid, Baby,
  Syringe, Tractor, Laptop, Camera, Hammer, Zap, Droplets, Paintbrush, Sofa, Package, Bike, Car,
  ShoppingBag, Receipt, Landmark, Pill, Calculator, Store, Utensils, CakeSlice, Shirt, Flower2,
  Palette, Video, Monitor, Leaf, HandHeart, Accessibility, Snowflake, Satellite, Tv, Headset, Music,
  Heart, Activity, Languages, School, ChefHat, Gift, Dog, House,
} from 'lucide-react'

export const CATEGORY_ICONS = {
  Stethoscope, HeartHandshake, BookOpenText, GraduationCap, SprayCan, Wrench, CarTaxiFront, Truck,
  Scissors, Sparkles, Briefcase, Wheat, Smartphone, PartyPopper, ClipboardList, LayoutGrid, Baby,
  Syringe, Tractor, Laptop, Camera, Hammer, Zap, Droplets, Paintbrush, Sofa, Package, Bike, Car,
  ShoppingBag, Receipt, Landmark, Pill, Calculator, Store, Utensils, CakeSlice, Shirt, Flower2,
  Palette, Video, Monitor, Leaf, HandHeart, Accessibility, Snowflake, Satellite, Tv, Headset, Music,
  Heart, Activity, Languages, School, ChefHat, Gift, Dog, House,
}

export const TONES = ['lime', 'lavender', 'sky', 'coral', 'dark']

export function CategoryIcon({ name, ...props }) {
  const Icon = CATEGORY_ICONS[name] || LayoutGrid
  return <Icon strokeWidth={1.6} {...props} />
}
