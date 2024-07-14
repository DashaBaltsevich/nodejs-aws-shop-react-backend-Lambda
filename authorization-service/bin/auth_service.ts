#!/usr/bin/env node
import "source-map-support/register"
import * as cdk from "aws-cdk-lib"
import { AuthServiceStack } from "../lib/auth_service_stack"

const app = new cdk.App()
new AuthServiceStack(app, "AuthServiceStack", {})
