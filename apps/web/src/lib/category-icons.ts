import {
  Scissors, Sparkles, Heart, Star, Sun, Smile, Eye,
  Hand, Zap, Droplets, Leaf, Crown, Gem, Palette,
  Brush, Wand2, Feather, Flower2, Bath, Dumbbell,
  Wind, Rainbow, Baby, Dog, Camera, Users, Clock,
  Flame, Snowflake, Moon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  scissors: Scissors,
  sparkles: Sparkles,
  heart: Heart,
  star: Star,
  sun: Sun,
  smile: Smile,
  eye: Eye,
  hand: Hand,
  zap: Zap,
  droplets: Droplets,
  leaf: Leaf,
  crown: Crown,
  gem: Gem,
  palette: Palette,
  brush: Brush,
  wand2: Wand2,
  feather: Feather,
  flower2: Flower2,
  bath: Bath,
  dumbbell: Dumbbell,
  wind: Wind,
  rainbow: Rainbow,
  baby: Baby,
  dog: Dog,
  camera: Camera,
  users: Users,
  clock: Clock,
  flame: Flame,
  snowflake: Snowflake,
  moon: Moon,
};

export type CategoryIconName = keyof typeof CATEGORY_ICONS;
