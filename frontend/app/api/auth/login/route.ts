import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Fetch user from custom logos_polis.users table
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    
    // Check if account is active
    if (user.status !== "ativo") {
       return NextResponse.json({ error: "Account inactive" }, { status: 403 });
    }

    // Compare passwords
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Create session cookie
    await createSession(user.id, user.role);

    return NextResponse.json({
      message: "Logged in successfully",
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: "Server Error", details: err.message }, { status: 500 });
  }
}
