import React from "react";
import Layout from "@/components/layouts/AdminPanelLayout";
import styles from "@/components/templates/p-admin/users/table.module.css";
import Table from "@/components/templates/p-admin/users/Table";
import connectToDB from "@/configs/db";
import UserModel from "@/models/User";
import { authAdmin } from "@/utils/serverHelpers";
import { redirect } from "next/navigation";

const page = async () => {
  const admin = await authAdmin();
  if (!admin) redirect("/login-register");
  await connectToDB();
  const users = await UserModel.find({}, "-password -refreshToken -__v").lean();

  return (
    <Layout>
      <main>
        {users.length === 0 ? (
          <p className={styles.empty}>کاربری وجود ندارد</p>
        ) : (
          <Table
            users={JSON.parse(JSON.stringify(users))}
            title="لیست کاربران"
          />
        )}
      </main>
    </Layout>
  );
};

export default page;
