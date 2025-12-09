/**
 * Lazy Loading Placeholder Component
 *
 * 延迟加载占位组件：在编辑器插件加载期间显示
 */

import { Box, Flex, Spinner, Text, Button, VStack, Icon } from "@chakra-ui/react";
import { AlertCircle, RefreshCw } from "lucide-react";

export interface LazyLoadingPlaceholderProps {
    openerId: string;
    uri: string;
    label?: string;
    status: "loading" | "error";
    error?: string;
    onRetry?: () => void;
}

export const LazyLoadingPlaceholder: React.FC<LazyLoadingPlaceholderProps> = ({
    label,
    status,
    error,
    onRetry,
}) => {
    if (status === "loading") {
        return (
            <Flex
                w="100%"
                h="100%"
                align="center"
                justify="center"
                direction="column"
                gap={4}
                bg="var(--chakra-colors-chakra-body-bg)"
            >
                <Spinner
                    size="xl"
                    thickness="4px"
                    speed="0.8s"
                    color="blue.500"
                    emptyColor="gray.200"
                />
                <VStack spacing={1}>
                    <Text fontSize="lg" fontWeight="medium" color="gray.600">
                        正在加载 {label || "编辑器"}
                    </Text>
                    <Text fontSize="sm" color="gray.400">
                        首次加载可能需要几秒钟...
                    </Text>
                </VStack>
            </Flex>
        );
    }

    if (status === "error") {
        return (
            <Flex
                w="100%"
                h="100%"
                align="center"
                justify="center"
                direction="column"
                gap={4}
                bg="var(--chakra-colors-chakra-body-bg)"
            >
                <Icon as={AlertCircle} boxSize={12} color="red.500" />
                <VStack spacing={2}>
                    <Text fontSize="lg" fontWeight="medium" color="gray.600">
                        加载失败
                    </Text>
                    {error && (
                        <Text fontSize="sm" color="gray.400" maxW="400px" textAlign="center">
                            {error}
                        </Text>
                    )}
                </VStack>
                {onRetry && (
                    <Button
                        leftIcon={<RefreshCw size={16} />}
                        colorScheme="blue"
                        variant="outline"
                        size="sm"
                        onClick={onRetry}
                    >
                        重试
                    </Button>
                )}
            </Flex>
        );
    }

    return null;
};

export default LazyLoadingPlaceholder;
