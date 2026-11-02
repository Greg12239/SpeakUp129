"use client";

import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Container } from "@/components/layout/Container";
import {
  StickyStory,
  type StoryStage,
} from "@/components/motion/StickyStory";
import { conversationStatements } from "@/content/site";

const conversationIntroLines = [
  "Every opportunity",
  "starts with a",
  "conversation.",
] as const;

const conversationStages: StoryStage[] = [
  {
    input: [0, 0.18, 0.43, 0.58],
    opacity: [0, 1, 1, 0],
    y: ["8%", "0%", "0%", "-8%"],
  },
  {
    input: [0.38, 0.58, 0.78, 0.94],
    opacity: [0, 1, 1, 0],
    y: ["8%", "0%", "0%", "-8%"],
  },
  {
    input: [0.74, 0.94, 1],
    opacity: [0, 1, 1],
    y: ["8%", "0%", "0%"],
  },
];

export function ConversationStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const bridgeY = useTransform(
    scrollYProgress,
    [0.08, 0.58],
    ["0%", "-76%"],
  );
  const color = useTransform(
    scrollYProgress,
    [0.08, 0.58],
    ["#3B0086", "#F4EFFA"],
  );

  return (
    <m.section
      ref={sectionRef}
      className="conversation-section"
      id="about"
      aria-labelledby="conversation-heading"
      data-nav-theme="ink"
      style={
        reducedMotion
          ? { backgroundColor: "#3B0086", color: "#F4EFFA" }
          : { color }
      }
    >
      {!reducedMotion ? (
        <m.span
          aria-hidden="true"
          className="conversation-chromatic-bridge"
          style={{ y: bridgeY }}
        />
      ) : null}
      <h2 className="sr-only" id="conversation-heading">
        Every opportunity starts with a conversation.
      </h2>
      <Container>
        <StickyStory
          statements={conversationStatements}
          className="conversation-story"
          statementClassName="conversation-statement"
          progress={scrollYProgress}
          showProgress={false}
          stages={conversationStages}
          introReveal={{
            lines: conversationIntroLines,
            lineStages: [
              { start: 0.02, end: 0.17 },
              { start: 0.07, end: 0.22 },
              { start: 0.12, end: 0.27 },
            ],
          }}
        />
      </Container>
    </m.section>
  );
}
