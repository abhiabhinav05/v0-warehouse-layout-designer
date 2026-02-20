import { UserRole } from "@/types/warehouse";
import { WORKFLOW_STAGES, VALID_TRANSITIONS } from "@/types/warehouse";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate if a workflow transition is allowed
 */
export function validateTransition(
  fromStage: string,
  toStage: string
): ValidationResult {
  const validTransitions = VALID_TRANSITIONS[fromStage];

  if (!validTransitions) {
    return {
      isValid: false,
      error: `Unknown stage: ${fromStage}`,
    };
  }

  if (!validTransitions.includes(toStage)) {
    return {
      isValid: false,
      error: `Cannot transition from ${fromStage} to ${toStage}. Valid transitions: ${validTransitions.join(", ")}`,
    };
  }

  return { isValid: true };
}

/**
 * Check if a user role can perform an action on a specific stage
 */
export function canAccessStage(stage: string, userRole: UserRole): boolean {
  const stageConfig = WORKFLOW_STAGES[stage];

  if (!stageConfig) {
    return false;
  }

  return stageConfig.requiredRole.includes(userRole);
}

/**
 * Check if a user role can approve requests
 */
export function canApprove(userRole: UserRole): boolean {
  return ["admin", "manager", "approver"].includes(userRole);
}

/**
 * Check if a user role can operate on stages
 */
export function canOperate(userRole: UserRole): boolean {
  return ["admin", "manager", "operator"].includes(userRole);
}

/**
 * Get next stage in workflow
 */
export function getNextStage(currentStage: string): string | null {
  const transitions = VALID_TRANSITIONS[currentStage];

  if (!transitions || transitions.length === 0) {
    return null;
  }

  // For most cases, there's only one valid next transition
  if (transitions.length === 1) {
    return transitions[0];
  }

  // If multiple options, return the first (could be enhanced with business logic)
  return transitions[0];
}

/**
 * Get all stages in order
 */
export function getStagesInOrder(): string[] {
  return Object.values(WORKFLOW_STAGES)
    .sort((a, b) => a.order - b.order)
    .map((stage) => stage.stage);
}

/**
 * Calculate completion percentage
 */
export function getCompletionPercentage(currentStage: string): number {
  const stages = getStagesInOrder().filter((s) => WORKFLOW_STAGES[s].order > 0);
  const currentIndex =
    stages.findIndex((s) => s === currentStage) + 1;

  return Math.round((currentIndex / stages.length) * 100);
}

/**
 * Check if stage is a terminal stage (no further transitions possible)
 */
export function isTerminalStage(stage: string): boolean {
  const transitions = VALID_TRANSITIONS[stage];
  return !transitions || transitions.length === 0;
}

/**
 * Get stage display info
 */
export function getStageInfo(stage: string) {
  return WORKFLOW_STAGES[stage] || null;
}
