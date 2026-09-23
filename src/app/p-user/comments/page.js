import DataTable from "@/components/templates/p-user/comments/DataTable";
import Layout from "@/components/layouts/UserPanelLayout";
import React from "react";
import connectToDB from "@/configs/db";
import Commentmodel from "@/models/Comment";
import { authUser } from "@/utils/serverHelpers";
import { redirect } from "next/navigation";

const page = async () => {
  await connectToDB();
  const user = await authUser();
  if (!user) redirect("/login-register");
  const comments = await Commentmodel.find(
    { $or: [{ user: user._id }, ...(user.email ? [{ email: user.email }] : [])] },
    "-__v"
  ).populate("productID", "name");


  return (
    <Layout>
      <main>
        <DataTable
          comments={JSON.parse(JSON.stringify(comments))}
          title="لیست کامنت‌ها"
        />
        {/* <p className={styles.empty}>
          کامنتی وجود ندارد
        </p>  */}
      </main>
    </Layout>
  );
};

export default page;
