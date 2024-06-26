import { HStack, VStack, Text } from "@chakra-ui/react";
import { ReactElement } from "react";
import toast from "react-hot-toast";
import Switch from "src/components/Switch";
import { useUserContext } from "src/contexts/userContext";
import { axiosAuth } from "src/utils/axios";

export default function PrivacySettings(): ReactElement {
    const { user, mutate } = useUserContext();

    const toggleShowRealName = async () => {
        try {
            await mutate(axiosAuth.post("settings/toggle-show-real-name", { showRealName: !user?.settings?.showRealName ?? true }), {
                optimisticData: { user: { ...user, settings: { ...user?.settings, showRealName: !user?.settings?.showRealName } } },
                populateCache: false,
                revalidate: false,
                rollbackOnError: true,
            });
        } catch (e) {
            toast.error("An error occurred while saving your settings");
        }
    };

    const toggleShowEmail = async () => {
        try {
            await mutate(axiosAuth.post("settings/toggle-show-email", { showEmail: !user?.settings?.showEmail ?? true }), {
                optimisticData: { user: { ...user, settings: { ...user?.settings, showEmail: !user?.settings?.showEmail } } },
                populateCache: false,
                revalidate: false,
                rollbackOnError: true,
            });
        } catch (e) {
            toast.error("An error occurred while saving your settings");
        }
    };

    const toggleAllowAllDMs = async () => {
        try {
            await mutate(axiosAuth.post("settings/toggle-allow-all-dms", { allowAllDMs: !user?.settings?.allowAllDMs ?? true }), {
                optimisticData: { user: { ...user, settings: { ...user?.settings, allowAllDMs: !user?.settings?.allowAllDMs } } },
                populateCache: false,
                revalidate: false,
                rollbackOnError: true,
            });
        } catch (e) {
            toast.error("An error occurred while saving your settings");
        }
    };

    const toggleReadReceipts = async () => {
        try {
            await mutate(axiosAuth.post("settings/toggle-read-receipts", { readReceipts: !user?.settings?.readReceipts ?? true }), {
                optimisticData: { user: { ...user, settings: { ...user?.settings, readReceipts: !user?.settings?.readReceipts } } },
                populateCache: false,
                revalidate: false,
                rollbackOnError: true,
            });
        } catch (e) {
            toast.error("An error occurred while saving your settings");
        }
    };

    return (
        <VStack align="start" width="full" p={2} spacing={6}>
            <Text fontSize="xl" fontWeight="bold">Personal Information</Text>
            <VStack width="full" align="start" spacing={4}>
                <HStack width="full" justify="space-between">
                    <Text fontSize="lg">Show Real Name on Profile</Text>
                    <Switch isChecked={user?.settings?.showRealName} onChange={toggleShowRealName} />
                </HStack>
                <HStack width="full" justify="space-between">
                    <Text fontSize="lg">Show Email on Profile</Text>
                    <Switch isChecked={user?.settings?.showEmail} onChange={toggleShowEmail} />
                </HStack>
            </VStack>
            <Text fontSize="xl" fontWeight="bold">Messaging</Text>
            <VStack width="full" align="start" spacing={4}>
                <HStack width="full" justify="space-between">
                    <Text fontSize="lg">Allow Anyone to Message You</Text>
                    <Switch isChecked={user?.settings?.allowAllDMs} onChange={toggleAllowAllDMs} />
                </HStack>
                <HStack width="full" justify="space-between">
                    <Text fontSize="lg">Read receipts</Text>
                    <Switch isChecked={user?.settings?.readReceipts} onChange={toggleReadReceipts} />
                </HStack>
            </VStack>
        </VStack>
    );
}
