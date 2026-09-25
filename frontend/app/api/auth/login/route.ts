import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // The RPC verifies the bcrypt hash without exposing password_hash through the API.
    const { data, error } = await supabase.rpc('authenticate_logos_polis_user', {
      p_email: email,
      p_password: password,
    });

    if (error) {
      console.error('Unable to authenticate Logos Polis user:', error);
      return NextResponse.json({ error: "Login configuration is unavailable" }, { status: 500 });
    }

    const user = data?.[0];
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await createSession(user.id, user.role);

    return NextResponse.json({
      message: "Logged in successfully",
      user,
    }, { status: 200 });
  } catch (err: unknown) {
    console.error('Login request failed:', err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
