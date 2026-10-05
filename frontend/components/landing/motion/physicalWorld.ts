import gsap from "gsap";

/** DOM objects retain their identity while a single timeline moves the camera. */
export type WorldObject = "business" | "question" | "archive" | "document" | "clause-rule" | "workspace" | "decision-task" | "evidence" | "trust";
export interface ObjectPose {
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  scale: number;
  autoAlpha: number;
}

export function createObjectRegistry(root: HTMLElement) {
  const objects = new Map<WorldObject, HTMLElement>();
  root.querySelectorAll<HTMLElement>("[data-world-object]").forEach(element => {
    objects.set(element.dataset.worldObject as WorldObject, element);
  });
  return {
    get(key: WorldObject) {
      const element = objects.get(key);
      if (!element) throw new Error(`Missing product story object: ${key}`);
      return element;
    },
    setup(key: WorldObject, pose: Partial<ObjectPose>) {
      gsap.set(this.get(key), { xPercent: -50, yPercent: -50, transformOrigin: "50% 50%", ...pose });
    },
    objects,
  };
}
