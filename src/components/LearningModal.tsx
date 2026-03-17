import React, { useState } from "react";
import {
  Dimensions,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { PlayCircle, X, CheckCircle2, ChevronRight, BookOpen, ArrowLeft } from "lucide-react-native";
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from "../constants/theme";
import { useAuth } from "../context/AuthProvider";
import { LEARNING_MODULES, LearningModule } from "../data/learningConfig";
import { supabase } from "../lib/supabase";

const { width, height } = Dimensions.get("window");

export default function LearningModal({
  isVisible,
  onClose,
}: {
  isVisible: boolean;
  onClose: () => void;
}) {
  const { session } = useAuth();
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch persistent progress on mount
  React.useEffect(() => {
    if (isVisible && session?.user) {
      fetchProgress();
    }
  }, [isVisible, session?.user]);

  const fetchProgress = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('learning_progress')
        .select('module_id')
        .eq('user_id', session?.user?.id);

      if (error) throw error;
      if (data) {
        setCompletedModules(data.map(item => item.module_id));
      }
    } catch (err) {
      console.error("Error fetching learning progress:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteModule = async (moduleId: string, badgeId?: string) => {
    if (completedModules.includes(moduleId) || completingId) {
       setSelectedModule(null);
       return;
    }

    setCompletingId(moduleId);
    
    if (session?.user) {
      try {
        // Use the new consolidated RPC for completion and badges
        const { error } = await supabase.rpc("complete_learning_module", {
          p_module_id: moduleId,
          p_badge_id: badgeId || null,
        });

        if (error) throw error;

        // Optimistically update local state
        setCompletedModules((prev) => [...prev, moduleId]);
      } catch (err) {
        console.error("Error completing module:", err);
      }
    }

    setCompletingId(null);
    setSelectedModule(null); // Return to dashboard
  };

  const openVideo = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Couldn't load page", err)
    );
  };

  const renderDashboard = () => (
    <ScrollView 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.dashboardHeader}>
        <Text style={styles.dashboardTitle}>Learning Hub</Text>
        <Text style={styles.dashboardSubtitle}>Master the PulseThread ecosystem to earn exclusive badges.</Text>
      </View>

      <View style={styles.lessonList}>
        {LEARNING_MODULES.map((module) => {
          const isCompleted = completedModules.includes(module.id);
          return (
            <TouchableOpacity 
              key={module.id} 
              style={[styles.lessonCard, isCompleted && styles.lessonCardCompleted]}
              onPress={() => setSelectedModule(module)}
            >
              <View style={styles.lessonIconContainer}>
                {isCompleted ? (
                  <CheckCircle2 size={24} color={COLORS.primary} />
                ) : (
                  <BookOpen size={24} color={COLORS.darkGray} />
                )}
              </View>
              <View style={styles.lessonInfo}>
                <Text style={styles.lessonTitle}>{module.title}</Text>
                <Text style={styles.lessonDesc} numberOfLines={2}>{module.description}</Text>
              </View>
              <ChevronRight size={20} color={COLORS.gray} />
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderModuleDetail = (module: LearningModule) => {
    const isCompleted = completedModules.includes(module.id);
    const isCompleting = completingId === module.id;

    return (
      <View style={styles.detailContainer}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.moduleTitle}>{module.title}</Text>
          <Text style={styles.moduleDescription}>{module.description}</Text>

          {module.showVideo && module.videoUrl ? (
            <TouchableOpacity
              style={styles.videoButton}
              onPress={() => openVideo(module.videoUrl!)}
            >
              <PlayCircle size={22} color={COLORS.white} />
              <Text style={styles.videoButtonText}>Watch Video Guide</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.blocksContainer}>
            {module.contentBlocks.map((block, idx) => {
              if (!block.show) return null;
              return (
                <View key={block.id} style={styles.blockCard}>
                  <View style={styles.blockNumberContainer}>
                    <Text style={styles.blockNumber}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.blockText}>{block.text}</Text>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            style={[
              styles.completeButton,
              isCompleted && styles.completedButton,
            ]}
            onPress={() => handleCompleteModule(module.id, module.badgeAwarded)}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : isCompleted ? (
              <View style={styles.buttonContent}>
                <CheckCircle2 size={20} color={COLORS.white} />
                <Text style={styles.completeButtonText}>Return to Dashboard</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.completeButtonText}>Mark as Completed</Text>
                <CheckCircle2 size={20} color={COLORS.white} />
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Unified Header Row */}
          <View style={styles.modalHeaderRow}>
            {selectedModule ? (
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => setSelectedModule(null)}
              >
                <ArrowLeft size={22} color={COLORS.text} />
                <Text style={styles.backText}>Dashboard</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {selectedModule ? renderModuleDetail(selectedModule) : renderDashboard()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  modalContent: {
    width: width * 0.94,
    height: height * 0.88,
    backgroundColor: COLORS.white,
    borderRadius: 36,
    paddingTop: SPACING.md,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
    minHeight: 50,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 40,
  },
  dashboardHeader: {
    marginBottom: SPACING.xl,
  },
  dashboardTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: -1,
  },
  dashboardSubtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.darkGray,
    opacity: 0.8,
    marginTop: 4,
  },
  lessonList: {
    gap: SPACING.md,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    borderRadius: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  lessonCardCompleted: {
    borderColor: 'rgba(231, 76, 60, 0.1)',
    backgroundColor: 'rgba(231, 76, 60, 0.03)',
  },
  lessonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.card,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  lessonDesc: {
    fontSize: 13,
    color: COLORS.darkGray,
    marginTop: 2,
    lineHeight: 18,
  },
  detailContainer: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: SPACING.xs,
  },
  backText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  moduleTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    letterSpacing: -0.5,
  },
  moduleDescription: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.darkGray,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  videoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF0000",
    padding: SPACING.md,
    borderRadius: 16,
    marginBottom: SPACING.xl,
    gap: 10,
    ...SHADOWS.button,
  },
  videoButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: TYPOGRAPHY.sizes.md,
  },
  blocksContainer: {
    gap: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  blockCard: {
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    borderRadius: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    flexDirection: "row",
    gap: 12,
  },
  blockNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(231, 76, 60, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  blockNumber: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 14,
  },
  blockText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
    lineHeight: 24,
    flex: 1,
  },
  completeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.button,
  },
  completedButton: {
    backgroundColor: COLORS.text,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  completeButtonText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: TYPOGRAPHY.sizes.lg,
    letterSpacing: 0.5,
  },
});
