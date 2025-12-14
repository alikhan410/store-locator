import { Badge, Text, InlineStack, Icon } from "@shopify/polaris";
import { EmailIcon, ChatIcon, PhoneIcon, ClockIcon } from "@shopify/polaris-icons";

export function SupportLevelIndicator({ subscription }) {
  const getSupportInfo = () => {
    if (!subscription || subscription.status !== 'ACTIVE') {
      return {
        level: 'free',
        name: 'Email Support',
        responseTime: '24-48 hours',
        icon: EmailIcon,
        color: 'base',
        description: 'Standard email support'
      };
    }
    
    const planName = subscription.name?.toLowerCase();
    
    if (planName === 'startup' || planName === 'basic') {
      return {
        level: 'basic',
        name: 'Priority Email',
        responseTime: '12-24 hours',
        icon: EmailIcon,
        color: 'success',
        description: 'Enhanced email support'
      };
    }
    
    if (planName === 'pro') {
      return {
        level: 'pro',
        name: 'Premium Support',
        responseTime: '4-8 hours',
        icon: ChatIcon,
        color: 'success',
        description: 'Live chat & phone support'
      };
    }
    
    // Default to free support
    return {
      level: 'free',
      name: 'Email Support',
      responseTime: '24-48 hours',
      icon: EmailIcon,
      color: 'base',
      description: 'Standard email support'
    };
  };
  
  const supportInfo = getSupportInfo();
  
  return (
    <InlineStack gap="200" align="center">
      <Icon source={supportInfo.icon} color={supportInfo.color} />
      <Text variant="bodySm" color="subdued">
        {supportInfo.name} • {supportInfo.responseTime}
      </Text>
      <Badge tone={supportInfo.color} size="small">
        {supportInfo.level}
      </Badge>
    </InlineStack>
  );
}

export function SupportResponseTime({ subscription }) {
  const getResponseTime = () => {
    if (!subscription || subscription.status !== 'ACTIVE') {
      return '24-48 hours';
    }
    
    const planName = subscription.name?.toLowerCase();
    
    if (planName === 'startup' || planName === 'basic') {
      return '12-24 hours';
    }
    
    if (planName === 'pro') {
      return '4-8 hours';
    }
    
    return '24-48 hours';
  };
  
  return (
    <InlineStack gap="200" align="center">
      <Icon source={ClockIcon} color="base" />
      <Text variant="bodySm" color="subdued">
        Response time: {getResponseTime()}
      </Text>
    </InlineStack>
  );
}

export function SupportUpgradePrompt({ subscription, onUpgrade }) {
  if (subscription && subscription.status === 'ACTIVE') {
    const planName = subscription.name?.toLowerCase();
    if (planName === 'pro') {
      return null; // Already at highest level
    }
  }
  
  return (
    <Text variant="bodySm" color="subdued">
      💡 <a href="#" onClick={onUpgrade} style={{ color: 'inherit', textDecoration: 'underline' }}>
        Upgrade for faster support
      </a>
    </Text>
  );
} 