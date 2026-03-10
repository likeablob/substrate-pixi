import { defaultConfig } from "@/lib/store";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SubstrateCanvas } from "./SubstrateCanvas";

const storyEngineConfig = {
  ...defaultConfig.engine,
  seed: 123456,
};

const meta = {
  title: "Substrate/SubstrateCanvas",
  component: SubstrateCanvas,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    engineConfig: storyEngineConfig,
    interactive: true,
    enableZoom: true,
    enablePan: true,
  },
  argTypes: {
    engineConfig: {
      control: "object",
    },
  },
} satisfies Meta<typeof SubstrateCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    engineConfig: defaultConfig.engine,
  },
};

export const LargeDensity: Story = {
  args: {
    engineConfig: {
      ...defaultConfig.engine,
      density: 500,
    },
  },
};

export const FixedSeed: Story = {
  args: {
    engineConfig: {
      ...defaultConfig.engine,
      seed: 123456,
    },
  },
};

export const NonInteractive: Story = {
  args: {
    engineConfig: storyEngineConfig,
    interactive: false,
  },
};

export const ZoomOnly: Story = {
  args: {
    engineConfig: storyEngineConfig,
    interactive: true,
    enableZoom: true,
    enablePan: false,
  },
};
