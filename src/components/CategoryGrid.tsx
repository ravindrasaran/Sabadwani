import React from "react";
import { Book, CalendarDays, Music, BookOpenText, Target, Users, ListOrdered, Sun, HeartHandshake } from "lucide-react";
import CategoryCard from "./CategoryCard";

interface CategoryGridProps {
  handleOpenCategory: (type: string, listType: string, category?: string) => void;
  navigateTo: (screen: string) => void;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ handleOpenCategory, navigateTo }) => {
  return (
    <div className="grid grid-cols-3 gap-3 px-4 mt-2 flex-1 overflow-y-auto pb-12 hide-scrollbar">
      <CategoryCard onClick={() => handleOpenCategory("reading", "shabad_list")} icon={Book} titleLine1="संपूर्ण" titleLine2="सबदवाणी" />
      <CategoryCard onClick={() => navigateTo("amavasya")} icon={CalendarDays} titleLine1="अमावस्या" titleLine2="दर्शन" />
      <CategoryCard onClick={() => handleOpenCategory("audio_reading", "category_list", "aarti")} icon={Music} titleLine1="आरती" titleLine2="संग्रह" />
      <CategoryCard onClick={() => handleOpenCategory("audio_reading", "category_list", "bhajan")} icon={Music} titleLine1="भजन" titleLine2="संग्रह" />
      <CategoryCard onClick={() => handleOpenCategory("audio_reading", "category_list", "sakhi")} icon={BookOpenText} titleLine1="साखी" titleLine2="संग्रह" />
      <CategoryCard onClick={() => handleOpenCategory("audio_reading", "category_list", "mantra")} icon={Music} titleLine1="गुरु" titleLine2="मंत्र" />
      <CategoryCard onClick={() => navigateTo("mala")} icon={Target} titleLine1="जाप" titleLine2="माला" />
      <CategoryCard onClick={() => navigateTo("mele")} icon={Users} titleLine1="प्रमुख" titleLine2="मेले" />
      <CategoryCard onClick={() => navigateTo("niyam")} icon={ListOrdered} titleLine1="२९" titleLine2="नियम" />
      <CategoryCard onClick={() => navigateTo("choghadiya")} icon={Sun} titleLine1="चौघड़िया" titleLine2="मुहूर्त" />
      <CategoryCard onClick={() => navigateTo("bichhuda")} icon={Book} titleLine1="बिछुड़ा (विदर)" titleLine2="" />
      <CategoryCard onClick={() => navigateTo("community_posts")} icon={HeartHandshake} titleLine1="भक्त" titleLine2="योगदान" />
    </div>
  );
};

export default CategoryGrid;
