import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon, CheckCircleIcon } from "@/components/ui/icon";

export default function HomePage() {
  return (
    <Box className="flex-1 bg-background-0">
      {/* Hero Section */}
      <Box className="bg-primary-500 py-20 lg:py-32">
        <Center>
          <VStack space="md" className="items-center max-w-3xl px-4">
            <Heading size="4xl" className="text-typography-0 text-center">
              Welcome to SmarTODO
            </Heading>
            <Text size="xl" className="text-primary-100 text-center">
              The intelligent task manager that helps you achieve more, effortlessly.
            </Text>
            <Button size="xl" action="secondary" className="mt-6">
              <ButtonText>Get Started for Free</ButtonText>
            </Button>
          </VStack>
        </Center>
      </Box>

      {/* Features Section */}
      <Box className="py-16 lg:py-24">
        <Center>
          <VStack space="xl" className="max-w-5xl px-4">
            <Heading size="3xl" className="text-center text-typography-900">
              Why SmarTODO?
            </Heading>
            <HStack space="lg" className="flex-wrap justify-center mt-10">
              <FeatureItem
                title="AI-Powered Suggestions"
                description="Let our smart AI help you break down tasks and suggest next steps."
              />
              <FeatureItem
                title="Seamless Collaboration"
                description="Share projects and tasks with your team in real-time."
              />
              <FeatureItem
                title="Beautiful & Intuitive UI"
                description="Enjoy a clean, modern interface that's a pleasure to use."
              />
            </HStack>
          </VStack>
        </Center>
      </Box>

      {/* Call to Action Section */}
      <Box className="bg-secondary-100 py-16 lg:py-24">
        <Center>
          <VStack space="md" className="items-center max-w-2xl px-4 text-center">
            <Heading size="2xl" className="text-typography-900">
              Ready to Boost Your Productivity?
            </Heading>
            <Text size="lg" className="text-typography-700">
              Sign up today and experience the future of task management.
            </Text>
            <Button size="xl" action="primary" className="mt-6">
              <ButtonText>Sign Up Now</ButtonText>
            </Button>
          </VStack>
        </Center>
      </Box>

      {/* Footer */}
      <Box className="py-8 bg-neutral-800">
        <Center>
          <Text className="text-neutral-400">
            © {new Date().getFullYear()} SmarTODO. All rights reserved.
          </Text>
        </Center>
      </Box>
    </Box>
  );
}

interface FeatureItemProps {
  title: string;
  description: string;
}

const FeatureItem = ({ title, description }: FeatureItemProps) => {
  return (
    <Box className="bg-background-0 p-6 rounded-lg shadow-md w-full md:w-1/3 max-w-sm m-2">
      <VStack space="sm">
        <HStack space="sm" className="items-center">
          <Icon as={CheckCircleIcon} size="md" className="text-primary-500" />
          <Heading size="lg" className="text-typography-900">{title}</Heading>
        </HStack>
        <Text className="text-typography-700">{description}</Text>
      </VStack>
    </Box>
  );
};

