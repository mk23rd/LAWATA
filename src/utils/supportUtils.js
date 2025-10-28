import { Timestamp, collection, addDoc } from "firebase/firestore";
import { toast } from "react-toastify";

/**
 * Validates if a user can support a project
 */
export const validateSupportRequest = (currentUser, projectData, userData, amount) => {
  if (!currentUser) {
    throw new Error("Please sign in to proceed.");
  }

  if (!userData) {
    throw new Error("User data not found. Please try again.");
  }

  // Profile completeness check
  const hasCompleteProfile = Boolean(
    userData.phoneNumber &&
    userData.profileImageUrl &&
    userData.bio &&
    userData.location?.city &&
    userData.location?.country
  );

  if (!hasCompleteProfile) {
    throw new Error("Please complete your profile before supporting a project.");
  }

  // Prevent supporting own project
  if (projectData.createdBy?.uid === currentUser.uid) {
    throw new Error("You cannot support your own project.");
  }

  // Validate amount
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error("Please enter a valid amount.");
  }

  // Check funding goal
  const currentFunded = projectData.fundedMoney ?? 0;
  const fundingGoal = projectData.fundingGoal ?? Infinity;
  const remaining = fundingGoal - currentFunded;

  if (numericAmount > remaining) {
    throw new Error(`You can only fund up to ETB ${remaining.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}.`);
  }

  return { numericAmount, currentFunded, fundingGoal };
};

/**
 * Validates a selected reward
 */
export const validateReward = (reward, projectData, amount) => {
  if (!reward) return null;
  
  const rewardFromProject = projectData.rewardsList?.[reward.index];
  if (!rewardFromProject) {
    throw new Error("Selected reward no longer exists.");
  }
  
  const rewardAmount = parseFloat(rewardFromProject.amount) || 0;
  if (amount < rewardAmount) {
    throw new Error(
      `Your contribution of ETB ${amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ` +
      `is insufficient for the selected reward (requires ETB ${rewardAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}).`
    );
  }
  
  if (rewardFromProject.type === 'limited') {
    const remainingQuantity = rewardFromProject.quantity - (rewardFromProject.claimed || 0);
    if (remainingQuantity <= 0) {
      throw new Error("Selected reward is out of stock.");
    }
  }
  
  return {
    ...rewardFromProject,
    index: reward.index
  };
};

/**
 * Checks for and processes milestone completions
 */
export const checkMilestones = (currentFunded, newAmount, fundingGoal, milestones = {}) => {
  const newFundedMoney = currentFunded + newAmount;
  const reachedMilestones = [];
  
  [25, 50, 75, 100].forEach(percentage => {
    if (milestones[percentage]) {
      const milestoneAmount = (fundingGoal * percentage) / 100;
      const previousPercentage = (currentFunded / fundingGoal) * 100;
      const newPercentage = (newFundedMoney / fundingGoal) * 100;

      if (previousPercentage < percentage && newPercentage >= percentage) {
        reachedMilestones.push({
          percentage,
          description: milestones[percentage].description,
          amount: milestoneAmount
        });
      }
    }
  });

  return { reachedMilestones, newFundedMoney };
};

/**
 * Creates a notification
 */
export const createNotification = async (db, notificationData) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      ...notificationData,
      read: false,
      createdAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw error to prevent blocking the main flow
  }
};

/**
 * Creates reward data for a supported project
 */
export const createRewardData = (reward, projectData, projectId) => {
  if (!reward) return null;
  
  return {
    rewardId: reward.id || `reward_${reward.index}_${Date.now()}`,
    description: reward.description,
    imageUrl: reward.imageUrl,
    title: reward.title,
    type: reward.type,
    projectId,
    projectTitle: projectData.title,
    claimedAt: Timestamp.now(),
    amount: reward.amount
  };
};
