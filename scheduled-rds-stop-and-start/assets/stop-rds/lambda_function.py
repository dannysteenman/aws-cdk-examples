# this Code will help to schedule stop the RDS databasrs using Lambda
# Yesh
# Version -- 2.0

import os

import boto3


def shut_rds_all():
    region = os.environ["REGION"]
    key = os.environ["KEY"]
    value = os.environ["VALUE"]

    client = boto3.client("rds", region_name=region)
    response = client.describe_db_instances()
    v_readReplica = []
    for i in response["DBInstances"]:
        readReplica = i["ReadReplicaDBInstanceIdentifiers"]
        v_readReplica.extend(readReplica)

    for i in response["DBInstances"]:
        # The if condition below filters aurora clusters from single instance databases as boto3 commands defer to stop the aurora clusters.
        if i["Engine"] not in ["aurora-mysql", "aurora-postgresql"]:
            # The if condition below filters Read replicas.
            if i["DBInstanceIdentifier"] not in v_readReplica and len(i["ReadReplicaDBInstanceIdentifiers"]) == 0:
                arn = i["DBInstanceArn"]
                resp2 = client.list_tags_for_resource(ResourceName=arn)
                # check if the RDS instance is part of the Auto-Shutdown group.
                if 0 == len(resp2["TagList"]):
                    print("DB Instance {0} is not part of autoshutdown".format(i["DBInstanceIdentifier"]))
                else:
                    for tag in resp2["TagList"]:
                        # If the tags match, then stop the instances by validating the current status.
                        if tag["Key"] == key and tag["Value"] == value:
                            if i["DBInstanceStatus"] == "available":
                                client.stop_db_instance(DBInstanceIdentifier=i["DBInstanceIdentifier"])
                                print("stopping DB instance {0}".format(i["DBInstanceIdentifier"]))
                            elif i["DBInstanceStatus"] == "stopped":
                                print("DB Instance {0} is already stopped".format(i["DBInstanceIdentifier"]))
                            elif i["DBInstanceStatus"] == "starting":
                                print(
                                    "DB Instance {0} is in starting state. Please stop the cluster after starting is complete".format(
                                        i["DBInstanceIdentifier"]
                                    )
                                )
                            elif i["DBInstanceStatus"] == "stopping":
                                print("DB Instance {0} is already in stopping state.".format(i["DBInstanceIdentifier"]))
                        elif tag["Key"] != key and tag["Value"] != value:
                            print("DB instance {0} is not part of autoshutdown".format(i["DBInstanceIdentifier"]))
                        elif len(tag["Key"]) == 0 or len(tag["Value"]) == 0:
                            print("DB Instance {0} is not part of auroShutdown".format(i["DBInstanceIdentifier"]))
            elif i["DBInstanceIdentifier"] in v_readReplica:
                print(
                    "DB Instance {0} is a Read Replica. Cannot shutdown a Read Replica instance".format(
                        i["DBInstanceIdentifier"]
                    )
                )
            else:
                print(
                    "DB Instance {0} has a read replica. Cannot shutdown a database with Read Replica".format(
                        i["DBInstanceIdentifier"]
                    )
                )

    response = client.describe_db_clusters()
    for i in response["DBClusters"]:
        cluarn = i["DBClusterArn"]
        resp2 = client.list_tags_for_resource(ResourceName=cluarn)
        if 0 == len(resp2["TagList"]):
            print("DB Cluster {0} is not part of autoshutdown".format(i["DBClusterIdentifier"]))
        else:
            for tag in resp2["TagList"]:
                if tag["Key"] == key and tag["Value"] == value:
                    if i["Status"] == "available":
                        client.stop_db_cluster(DBClusterIdentifier=i["DBClusterIdentifier"])
                        print("stopping DB cluster {0}".format(i["DBClusterIdentifier"]))
                    elif i["Status"] == "stopped":
                        print("DB Cluster {0} is already stopped".format(i["DBClusterIdentifier"]))
                    elif i["Status"] == "starting":
                        print(
                            "DB Cluster {0} is in starting state. Please stop the cluster after starting is complete".format(
                                i["DBClusterIdentifier"]
                            )
                        )
                    elif i["Status"] == "stopping":
                        print("DB Cluster {0} is already in stopping state.".format(i["DBClusterIdentifier"]))
                elif tag["Key"] != key and tag["Value"] != value:
                    print("DB Cluster {0} is not part of autoshutdown".format(i["DBClusterIdentifier"]))
                else:
                    print("DB Instance {0} is not part of auroShutdown".format(i["DBClusterIdentifier"]))


def lambda_handler(event, context):
    shut_rds_all()
