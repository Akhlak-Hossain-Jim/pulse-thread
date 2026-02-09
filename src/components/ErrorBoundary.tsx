import { RefreshCcw } from 'lucide-react-native';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
        if (this.props.fallback) {
            return this.props.fallback;
        }

        return (
            <View style={styles.container}>
                <View style={styles.errorBox}>
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.message}>
                        {this.state.error?.message || "An unexpected error occurred."}
                    </Text>
                    {/* Detailed Error for Debugging */}
                    <View style={styles.detailsContainer}>
                        <Text style={styles.detailsTitle}>Error Details:</Text>
                        <Text style={styles.detailsText}>
                            {this.state.error?.toString()}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.button} onPress={this.handleReset}>
                        <RefreshCcw size={20} color={COLORS.white} />
                        <Text style={styles.buttonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
  },
  errorBox: {
    width: '100%',
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: SPACING.md,
  },
  message: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.lg,
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 12,
    color: COLORS.text,
    fontFamily: 'monospace',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
