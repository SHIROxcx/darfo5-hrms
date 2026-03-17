<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PdsQuestion extends Model {
    protected $table = 'pds_questions';
    protected $fillable = [
        'user_id',
        'q34_a','q34_b','q34_details',
        'q35_a','q35_a_details','q35_b','q35_b_date','q35_b_status',
        'q36','q36_details',
        'q37_a','q37_a_details','q37_b','q37_b_details',
        'q38','q38_details',
        'q39','q39_details',
        'q40_a','q40_a_details','q40_b','q40_b_details','q40_c','q40_c_details',
    ];
    protected $casts = [
        'q34_a'=>'boolean','q34_b'=>'boolean','q35_a'=>'boolean','q35_b'=>'boolean',
        'q36'=>'boolean','q37_a'=>'boolean','q37_b'=>'boolean','q38'=>'boolean',
        'q39'=>'boolean','q40_a'=>'boolean','q40_b'=>'boolean','q40_c'=>'boolean',
    ];
}