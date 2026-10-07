"use client";

import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { getTalentAnimal, getTalentAvatarBackground } from "@/lib/talentAvatarConfig";

const sizes = {
  sm: "h-[3.125rem] w-[3.125rem]",
  md: "h-[4.375rem] w-[4.375rem]",
  lg: "h-[6.25rem] w-[6.25rem]",
};

export default function TalentAvatar({ animal, descriptor, alias, background, size = "md", className = "" }) {
  const animalConfig = getTalentAnimal(animal);
  const [hasAsset, setHasAsset] = useState(Boolean(animalConfig));

  useEffect(() => {
    setHasAsset(Boolean(animalConfig));
  }, [animal]);

  const descriptorClass = descriptor ? `talent-avatar-${String(descriptor).toLowerCase()}` : "";
  const backgroundColor = getTalentAvatarBackground(background, alias);

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-xl border border-cyan-300/25 ${sizes[size] || sizes.md} ${descriptorClass} ${className}`}
      style={{ backgroundColor }}
    >
      {hasAsset && animalConfig ? (
        <img
          key={animalConfig.id}
          src={animalConfig.assetPath}
          alt={alias ? `${alias} avatar` : `${animalConfig.label} avatar`}
          className="h-full w-full object-contain p-1.5"
          onError={() => setHasAsset(false)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-cyan-100" role="img" aria-label={alias ? `${alias} avatar` : "Talent avatar"}>
          <UserRound className="h-1/2 w-1/2" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}