import { Composition } from "remotion";
import { VaultReveal } from "./VaultReveal";

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
    </>
  );
};
