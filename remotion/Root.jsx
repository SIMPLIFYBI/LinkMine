import { Composition } from "remotion";
import { VaultReveal } from "./VaultReveal";
import { YouMineHomeReveal } from "./YouMineHomeReveal";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="VaultReveal"
        component={VaultReveal}
        width={1080}
        height={1080}
        fps={30}
        durationInFrames={300}
      />
      <Composition
        id="YouMineHomeReveal"
        component={YouMineHomeReveal}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={360}
      />
    </>
  );
};
