"use client";

import {
  animate,
  m,
  motionValue,
  type MotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Container } from "@/components/layout/Container";
import {
  speakupStoryChapters,
  type SpeakupStoryChapter,
} from "@/content/site";
import { useHydrated } from "@/hooks/useHydrated";

type HyperFrameStoryProps = {
  transitionProgress: MotionValue<number>;
};

const chapterTiming = [
  { threshold: 0.018, line: 0.42, morph: 0.62, heading: 0.48, copy: 0.36 },
  { threshold: 0.22, line: 0.18, heading: 0.52, copy: 0.38 },
  { threshold: 0.49, line: 0.18, heading: 0.52, copy: 0.38 },
  { threshold: 0.76, line: 0.18, heading: 0.52, copy: 0.4 },
] as const;

const storyEase = [0.22, 1, 0.36, 1] as const;

type StoryStage = {
  line: MotionValue<number>;
  opacity: MotionValue<number>;
  x: MotionValue<number>;
  y: MotionValue<number>;
  scale: MotionValue<number>;
  headingY: MotionValue<string>;
  copyOpacity: MotionValue<number>;
  copyY: MotionValue<number>;
};

function createStoryStage(index: number): StoryStage {
  const isLead = index === 0;

  return {
    line: motionValue(0),
    opacity: motionValue(isLead ? 1 : 0),
    x: motionValue(0),
    y: motionValue(0),
    scale: motionValue(1),
    headingY: motionValue(isLead ? "0%" : "112%"),
    copyOpacity: motionValue(isLead ? 1 : 0),
    copyY: motionValue(isLead ? 0 : 18),
  };
}

function useLargeEditorialLayout() {
  const [largeLayout, setLargeLayout] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 70rem)");
    const update = () => setLargeLayout(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return largeLayout;
}

function useStoryStageController(
  progress: MotionValue<number>,
  enabled: boolean,
  onComplete: () => void,
) {
  const stages = useMemo(
    () => chapterTiming.map((_, index) => createStoryStage(index)),
    [],
  );
  const started = useRef(Array.from({ length: chapterTiming.length }, () => false));
  const completed = useRef(false);
  const queue = useRef(Promise.resolve());

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    const activeAnimations = new Set<{ stop: () => void }>();
    const play = <T extends number | string>(
      value: MotionValue<T>,
      target: T,
      duration: number,
    ) => {
      const controls = animate(value, target, { duration, ease: storyEase });
      activeAnimations.add(controls);
      return controls.then(() => activeAnimations.delete(controls));
    };
    const runStage = async (index: number) => {
      const stage = stages[index]!;
      const timing = chapterTiming[index]!;

      if (index === 0) {
        await Promise.all([
          play(stage.line, 1, timing.line),
          play(stage.x, 0, chapterTiming[0].morph),
          play(stage.y, 0, chapterTiming[0].morph),
        ]);
        return;
      }

      await play(stage.line, 1, timing.line);
      if (cancelled) {
        return;
      }

      await Promise.all([
        play(stage.opacity, 1, timing.heading),
        play(stage.y, 0, timing.heading),
        play(stage.scale, 1, timing.heading),
        play(stage.headingY, "0%", timing.heading),
      ]);
      if (cancelled) {
        return;
      }

      await Promise.all([
        play(stage.copyOpacity, 1, timing.copy),
        play(stage.copyY, 0, timing.copy),
      ]);

    };
    const startEligibleStages = (latest: number) => {
      chapterTiming.forEach((timing, index) => {
        if (latest < timing.threshold || started.current[index]) {
          return;
        }

        started.current[index] = true;
        const queuedStage = queue.current.then(() => runStage(index));
        queue.current = queuedStage;

        if (index === chapterTiming.length - 1) {
          void queuedStage.then(() => {
            const allStagesStarted = started.current.every(Boolean);

            if (!cancelled && !completed.current && allStagesStarted) {
              completed.current = true;
              onComplete();
            }
          });
        }
      });
    };

    startEligibleStages(progress.get());
    const unsubscribe = progress.on("change", startEligibleStages);

    return () => {
      cancelled = true;
      unsubscribe();
      activeAnimations.forEach((controls) => controls.stop());
    };
  }, [enabled, onComplete, progress, stages]);

  return stages;
}

type StorySupportingCopyProps = {
  children: string;
  className: string;
  opacity: MotionValue<number>;
  y: MotionValue<number>;
  enhanced: boolean;
};

function StorySupportingCopy({
  children,
  className,
  opacity,
  y,
  enhanced,
}: StorySupportingCopyProps) {
  return (
    <m.p className={className} style={enhanced ? { opacity, y } : undefined}>
      {children}
    </m.p>
  );
}

type StoryChapterProps = {
  chapter: SpeakupStoryChapter;
  stage: StoryStage;
  enhanced: boolean;
  mobileEnhanced: boolean;
  chapterRef?: RefObject<HTMLElement | null>;
};

function StoryChapter({
  chapter,
  stage,
  enhanced,
  mobileEnhanced,
  chapterRef,
}: StoryChapterProps) {
  return (
    <m.article
      className={`hyperframe-chapter hyperframe-chapter--${chapter.index}`}
      ref={chapterRef}
      style={enhanced ? { opacity: stage.opacity, x: stage.x, y: stage.y, scale: stage.scale } : undefined}
    >
      <m.span
        aria-hidden="true"
        className="hyperframe-mobile-chapter-line"
        style={mobileEnhanced ? { scaleX: stage.line } : undefined}
      />
      <div className="hyperframe-heading-mask">
        <m.h3 style={enhanced ? { y: stage.headingY } : undefined}>
          {chapter.headline}
        </m.h3>
      </div>
      {chapter.secondary ? (
        <StorySupportingCopy
          enhanced={enhanced}
          className="hyperframe-secondary"
          opacity={stage.copyOpacity}
          y={stage.copyY}
        >
          {chapter.secondary}
        </StorySupportingCopy>
      ) : null}
      {chapter.body.map((paragraph) => (
        <StorySupportingCopy
          enhanced={enhanced}
          className="hyperframe-body"
          key={paragraph}
          opacity={stage.copyOpacity}
          y={stage.copyY}
        >
          {paragraph}
        </StorySupportingCopy>
      ))}
    </m.article>
  );
}

function StructuralLine({
  className,
  progress,
  axis,
}: {
  className: string;
  progress: MotionValue<number>;
  axis: "x" | "y";
}) {
  return (
    <m.span
      aria-hidden="true"
      className={`hyperframe-structural-line ${className}`}
      style={axis === "x" ? { scaleX: progress } : { scaleY: progress }}
    />
  );
}

function StructuralLines({ stages }: { stages: StoryStage[] }) {
  return (
    <div aria-hidden="true" className="hyperframe-structural-lines">
      <StructuralLine axis="x" className="hyperframe-structural-line--top" progress={stages[0]!.line} />
      <StructuralLine axis="y" className="hyperframe-structural-line--left" progress={stages[0]!.line} />
      <StructuralLine axis="x" className="hyperframe-structural-line--middle-horizontal" progress={stages[1]!.line} />
      <StructuralLine axis="y" className="hyperframe-structural-line--middle-vertical" progress={stages[2]!.line} />
      <StructuralLine axis="y" className="hyperframe-structural-line--right" progress={stages[3]!.line} />
      <StructuralLine axis="x" className="hyperframe-structural-line--bottom" progress={stages[3]!.line} />
      <StructuralLine axis="y" className="hyperframe-structural-line--mobile-rail" progress={stages[0]!.line} />
    </div>
  );
}

export function HyperFrameStory({
  transitionProgress,
}: HyperFrameStoryProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const leadChapterRef = useRef<HTMLElement>(null);
  const hydrated = useHydrated();
  const reducedMotion = useReducedMotion();
  const largeLayout = useLargeEditorialLayout();
  const [completed, setCompleted] = useState(false);
  const { scrollYProgress: rawProgress } = useScroll({
    target: sectionRef,
    offset: largeLayout ? ["start start", "end end"] : ["start start", "end 0.3"],
  });
  const entranceOpacity = useTransform(
    transitionProgress,
    [0, 0.46, 1],
    [0.88, 1, 1],
  );
  const entranceY = useTransform(transitionProgress, [0, 0.46, 1], [20, 0, 0]);
  const desktopEnhanced = hydrated && !reducedMotion && largeLayout;
  const cascadeEnhanced = hydrated && !reducedMotion && !largeLayout;
  const enhanced = desktopEnhanced || cascadeEnhanced;
  const completeStory = useCallback(() => setCompleted(true), []);
  const stages = useStoryStageController(rawProgress, enhanced, completeStory);

  useLayoutEffect(() => {
    const leadStage = stages[0]!;

    if (!desktopEnhanced) {
      leadStage.x.set(0);
      leadStage.y.set(0);
      return;
    }

    const canvas = canvasRef.current;
    const chapter = leadChapterRef.current;

    if (!canvas || !chapter) {
      return;
    }

    const placeIntroAtCanvasCenter = () => {
      if (leadStage.line.get() > 0) {
        return;
      }

      const canvasBounds = canvas.getBoundingClientRect();
      const textBounds = Array.from(chapter.querySelectorAll("h3, p")).map(
        (element) => element.getBoundingClientRect(),
      );

      if (!textBounds.length) {
        return;
      }

      const left = Math.min(...textBounds.map((bounds) => bounds.left));
      const right = Math.max(...textBounds.map((bounds) => bounds.right));
      const top = Math.min(...textBounds.map((bounds) => bounds.top));
      const bottom = Math.max(...textBounds.map((bounds) => bounds.bottom));

      leadStage.x.set(canvasBounds.left + canvasBounds.width / 2 - (left + right) / 2);
      leadStage.y.set(canvasBounds.top + canvasBounds.height / 2 - (top + bottom) / 2);
    };

    placeIntroAtCanvasCenter();
    window.addEventListener("resize", placeIntroAtCanvasCenter);
    return () => window.removeEventListener("resize", placeIntroAtCanvasCenter);
  }, [desktopEnhanced, stages]);

  return (
    <section
      ref={sectionRef}
      className="hyperframe-story"
      id="speakup-story"
      aria-labelledby="speakup-story-heading"
      data-nav-theme="paper"
      data-enhanced={desktopEnhanced}
      data-cascade-enhanced={cascadeEnhanced}
      data-complete={completed}
    >
      <h2 className="sr-only" id="speakup-story-heading">
        SpeakUp: who we are, workshops, speaker events, and networking events
      </h2>
      <m.div
        ref={canvasRef}
        className="hyperframe-story-canvas"
        style={desktopEnhanced ? { opacity: entranceOpacity, y: entranceY } : undefined}
      >
        <Container className="hyperframe-story-inner">
          <div className="hyperframe-grid">
            {enhanced ? <StructuralLines stages={stages} /> : null}
            {speakupStoryChapters.map((chapter, index) => (
              <StoryChapter
                chapter={chapter}
                enhanced={enhanced}
                key={chapter.index}
                mobileEnhanced={cascadeEnhanced}
                stage={stages[index]!}
                chapterRef={index === 0 ? leadChapterRef : undefined}
              />
            ))}
          </div>
        </Container>
      </m.div>
    </section>
  );
}
