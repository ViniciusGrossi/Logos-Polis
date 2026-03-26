import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { name, email, password, role = "user", organization_id } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into custom logos_polis.users table
    const { data: user, error } = await supabase
      .from('users')
      .insert([
        { 
          name, 
          email, 
          password_hash: hashedPassword, 
          role,
          organization_id: organization_id || null, // Optional, can be null
          status: 'ativo'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create session cookie
    await createSession(user.id, user.role);

    return NextResponse.json({
      message: "User registered successfully",
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    }, { status: 201 });

  } catch (err: any) {
    return NextResponse.json({ error: "Server Error", details: err.message }, { status: 500 });
  }
}
