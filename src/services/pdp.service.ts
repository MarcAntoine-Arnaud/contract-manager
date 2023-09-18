// Policy Decision Point
import {
  AbilityBuilder,
  PureAbility,
  MatchConditions,
  SubjectType,
  mongoQueryMatcher,
} from '@casl/ability';
import policyService from 'services/policy.service';

// Define custom types and interfaces
export type PDPAction = 'POST' | 'GET' | 'UPDATE' | 'DELETE';

export interface PDPPolicy {
  subject: string;
  action: PDPAction;
  conditions?: any;
  fields?: [];
}

// Define an Ability type
type Ability = PureAbility<
  [PDPAction, Record<any, any> | SubjectType],
  MatchConditions
>;

// Lambda function for custom conditions matching
const lambdaMatcher = (matchConditions: MatchConditions) => {
  return matchConditions;
};

// Define the ability based on provided policies
const defineAbility = (policies: PDPPolicy[]) => {
  // Create an AbilityBuilder instance
  const { can: allow, build } = new AbilityBuilder<Ability>(PureAbility);
  // Define permissions based on policies
  policies.forEach((item: PDPPolicy) => {
    const matchConditions = mongoQueryMatcher(item.conditions);
    allow(
      item.action,
      item.subject,
      /*item.fields,*/
      matchConditions,
    );
  });
  // Build and return the ability using the lambda conditions matcher
  return build({ conditionsMatcher: lambdaMatcher });
};

// Evaluate a policy to check permissions
const evalPolicy = async (policy: PDPPolicy) => {
  // Define the ability based on policies
  const policies: PDPPolicy[] = policyService.fetch();
  const ability = defineAbility(policies);
  // Check if the given policy has permission
  const hasPermission = ability.can(policy.action, {
    constructor: {
      name: policy.subject,
    },
    ...policy.conditions,
  });
  return hasPermission;
};

export default { evalPolicy };
